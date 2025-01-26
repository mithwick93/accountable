import { Box, Button, Paper, Typography } from '@mui/material';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import log from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('Uncaught error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f8d7da',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              backgroundColor: '#f8d7da',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              Something went wrong.
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {this.state.errorMessage}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              sx={{ marginTop: 2 }}
            >
              Reload
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
