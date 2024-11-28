import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import ziinaService from '../services/ziinaService';

const ZiinaPaymentButton = ({
  amount,
  currency = 'AED',
  customerEmail,
  customerName,
  customerPhone,
  orderId,
  description,
  onSuccess,
  onError,
  onCancel,
  variant = 'contained',
  color = 'primary',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePaymentClick = async () => {
    try {
      setLoading(true);
      const paymentRequest = await ziinaService.createPaymentRequest({
        amount,
        currency,
        customerEmail,
        customerName,
        customerPhone,
        orderId,
        description,
      });

      // Redirect to Ziina payment page
      if (paymentRequest.redirect_url) {
        window.location.href = paymentRequest.redirect_url;
      } else {
        throw new Error('No redirect URL received from Ziina');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePaymentClick}
      disabled={disabled || loading}
      variant={variant}
      color={color}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
    >
      {loading ? 'Processing...' : 'Pay with Ziina'}
    </Button>
  );
};

export default ZiinaPaymentButton;
