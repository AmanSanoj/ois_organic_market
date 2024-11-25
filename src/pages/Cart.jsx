import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  IconButton,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/supabase';
import { useState } from 'react';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const [error, setError] = useState(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper elevation={3} sx={{ 
          mt: { xs: 4, sm: 8 }, 
          p: { xs: 2, sm: 4 }
        }}>
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/shop')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  const handleCheckout = async () => {
    try {
      console.log('Checking profile for user:', user.id);
      // Check if user has a profile
      const { data: profile, error: profileError } = await getUserProfile(user.id);
      
      console.log('Profile check result:', { profile, profileError });
      
      if (profileError) {
        console.error('Profile check error:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.log('No profile found, redirecting to signup');
        setError('Please complete your profile before checking out');
        setTimeout(() => {
          navigate('/login?tab=signup');
        }, 2000);
        return;
      }

      console.log('Profile found, proceeding to checkout');
      // If profile exists, proceed to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error checking profile:', error);
      setError('Failed to proceed to checkout. Please try again.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ 
        mt: { xs: 4, sm: 8 }, 
        p: { xs: 2, sm: 4 }
      }}>
        {cart.map((item) => (
          <Box key={item.id} sx={{ py: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  AED {item.price.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Box display="flex" justifyContent="flex-end">
                  <IconButton
                    color="error"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h6">Total</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6">
                AED {total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
