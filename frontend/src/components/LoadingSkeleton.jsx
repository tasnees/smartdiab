import React from 'react';
import { Skeleton, Box } from '@mui/material';

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box sx={{ width: '100%' }}>
    {[...Array(rows)].map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', mb: 2 }}>
        {[...Array(columns)].map((_, colIndex) => (
          <Box key={colIndex} sx={{ flex: 1, mx: 1 }}>
            <Skeleton variant="rectangular" height={40} animation="wave" />
          </Box>
        ))}
      </Box>
    ))}
  </Box>
);

export const FormSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    {[...Array(5)].map((_, index) => (
      <Skeleton 
        key={index} 
        variant="rectangular" 
        height={56} 
        sx={{ mb: 2 }} 
        animation="wave"
      />
    ))}
    <Skeleton 
      variant="rectangular" 
      width={120} 
      height={36} 
      animation="wave"
    />
  </Box>
);

export const CardSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="rectangular" height={24} width="60%" sx={{ mb: 2 }} animation="wave" />
    <Skeleton variant="rectangular" height={16} width="100%" sx={{ mb: 1 }} animation="wave" />
    <Skeleton variant="rectangular" height={16} width="80%" animation="wave" />
  </Box>
);

export default {
  Table: TableSkeleton,
  Form: FormSkeleton,
  Card: CardSkeleton,
};
