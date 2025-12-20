"""
DNS Configuration Module
This MUST be imported FIRST before any MongoDB or PyMongo imports
to configure DNS resolver timeouts for mongodb+srv:// connections.
"""
import logging

# Configure DNS resolver timeout BEFORE any MongoDB operations
# This prevents the 20+ second DNS timeout when using mongodb+srv://
try:
    import dns.resolver
    # Create a new resolver with custom configuration
    custom_resolver = dns.resolver.Resolver()
    
    # Use Google's public DNS servers as they're more reliable
    custom_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    # Set aggressive timeouts
    custom_resolver.timeout = 2  # 2 seconds per DNS server
    custom_resolver.lifetime = 5  # 5 seconds total for all attempts
    
    # Set as default resolver
    dns.resolver.default_resolver = custom_resolver
    
    logging.getLogger(__name__).info("DNS resolver configured: Google DNS (8.8.8.8, 8.8.4.4), 2s timeout, 5s lifetime")
except ImportError:
    logging.getLogger(__name__).warning("dnspython not available, DNS timeout configuration skipped")
except Exception as e:
    logging.getLogger(__name__).warning(f"Failed to configure DNS resolver: {e}")
