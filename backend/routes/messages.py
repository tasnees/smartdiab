"""
Messaging API Routes
Handles secure doctor-patient communication
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from models_enhanced import MessageCreate, MessageInDB, MessageType
from database import get_database

router = APIRouter(prefix="/messages", tags=["Messaging"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_message(message: MessageCreate, db=Depends(get_database)):
    """Send a new message"""
    try:
        message_dict = message.dict(by_alias=True, exclude={"id"})
        message_dict["created_at"] = datetime.utcnow()
        
        result = db.messages.insert_one(message_dict)
        
        created_message = db.messages.find_one({"_id": result.inserted_id})
        created_message["id"] = str(created_message.pop("_id"))
        
        return {"message": "Message sent successfully", "data": created_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")

@router.get("/inbox/{user_id}", response_model=List[dict])
def get_inbox(user_id: str, unread_only: bool = False, db=Depends(get_database)):
    """Get messages for a user (inbox)"""
    try:
        query = {"recipient_id": user_id}
        if unread_only:
            query["read"] = False
        
        messages = []
        for message in db.messages.find(query).sort("created_at", -1):
            message["id"] = str(message.pop("_id"))
            messages.append(message)
        
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inbox: {str(e)}")

@router.get("/sent/{user_id}", response_model=List[dict])
def get_sent_messages(user_id: str, db=Depends(get_database)):
    """Get messages sent by a user"""
    try:
        messages = []
        for message in db.messages.find({"sender_id": user_id}).sort("created_at", -1):
            message["id"] = str(message.pop("_id"))
            messages.append(message)
        
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sent messages: {str(e)}")

@router.get("/conversation/{user1_id}/{user2_id}", response_model=List[dict])
def get_conversation(user1_id: str, user2_id: str, db=Depends(get_database)):
    """Get conversation between two users"""
    try:
        messages = []
        for message in db.messages.find({
            "$or": [
                {"sender_id": user1_id, "recipient_id": user2_id},
                {"sender_id": user2_id, "recipient_id": user1_id}
            ]
        }).sort("created_at", 1):
            message["id"] = str(message.pop("_id"))
            messages.append(message)
        
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversation: {str(e)}")

@router.get("/{message_id}", response_model=dict)
def get_message(message_id: str, db=Depends(get_database)):
    """Get a specific message by ID"""
    try:
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=400, detail="Invalid message ID")
        
        message = db.messages.find_one({"_id": ObjectId(message_id)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        message["id"] = str(message.pop("_id"))
        return message
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching message: {str(e)}")

@router.put("/{message_id}/mark-read", response_model=dict)
def mark_message_read(message_id: str, db=Depends(get_database)):
    """Mark a message as read"""
    try:
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=400, detail="Invalid message ID")
        
        result = db.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        updated_message = db.messages.find_one({"_id": ObjectId(message_id)})
        updated_message["id"] = str(updated_message.pop("_id"))
        
        return {"message": "Message marked as read", "data": updated_message}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking message as read: {str(e)}")

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: str, db=Depends(get_database)):
    """Delete a message"""
    try:
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=400, detail="Invalid message ID")
        
        result = db.messages.delete_one({"_id": ObjectId(message_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting message: {str(e)}")

@router.get("/unread-count/{user_id}", response_model=dict)
def get_unread_count(user_id: str, db=Depends(get_database)):
    """Get count of unread messages for a user"""
    try:
        count = db.messages.count_documents({"recipient_id": user_id, "read": False})
        
        return {"user_id": user_id, "unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting unread messages: {str(e)}")
