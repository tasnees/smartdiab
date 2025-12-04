import React from 'react';
import { Typography, Button, Box } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error: error 
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });    
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            p: 4, 
            maxWidth: 600, 
            mx: 'auto',
            textAlign: 'center',
            mt: 4
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          
          <Box 
            component="pre" 
            sx={{ 
              p: 2, 
              mt: 2, 
              mb: 3, 
              textAlign: 'left',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 1,
              overflowX: 'auto',
              fontSize: '0.8rem'
            }}
          >
            {this.state.error?.toString()}
            {this.state.errorInfo?.componentStack}
          </Box>

          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReset}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
