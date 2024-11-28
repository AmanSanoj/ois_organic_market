import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import ZiinaPaymentButton from './ZiinaPaymentButton';

const Checkout = ({ order }) => {
  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // Handle payment error (e.g., show error message to user)
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Checkout
        </Typography>
        
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          {/* Add your order summary details here */}
          <Typography>
            Total Amount: AED {order?.totalAmount || '0.00'}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <ZiinaPaymentButton
            amount={order?.totalAmount || 0}
            currency="AED"
            customerEmail={order?.customerEmail}
            customerName={order?.customerName}
            customerPhone={order?.customerPhone}
            orderId={order?.id}
            description={`Order #${order?.id}`}
            onError={handlePaymentError}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default Checkout;
