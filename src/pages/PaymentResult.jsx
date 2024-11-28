import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import ziinaService from '../services/ziinaService';

const PaymentResult = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get payment_request_id from URL parameters
        const params = new URLSearchParams(location.search);
        const paymentRequestId = params.get('payment_request_id');

        if (!paymentRequestId) {
          setStatus('error');
          setMessage('Payment reference not found');
          return;
        }

        const result = await ziinaService.getPaymentStatus(paymentRequestId);
        
        if (result.status === 'paid') {
          setStatus('success');
          setMessage('Payment successful! Thank you for your purchase.');
        } else if (result.status === 'cancelled') {
          setStatus('cancelled');
          setMessage('Payment was cancelled.');
        } else {
          setStatus('error');
          setMessage('Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        setMessage('Unable to verify payment status.');
      }
    };

    checkPaymentStatus();
  }, [location]);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />;
      case 'cancelled':
        return <CancelIcon sx={{ fontSize: 64, color: 'warning.main' }} />;
      default:
        return <CircularProgress size={64} />;
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box sx={{ mb: 2 }}>{getIcon()}</Box>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {status === 'loading' ? 'Verifying Payment...' : 'Payment Status'}
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
        >
          Return to Home
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentResult;
