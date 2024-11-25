import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getUserOrders } from '../services/supabase';

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'info';
    case 'delivered':
      return 'success';
    default:
      return 'default';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await getUserOrders(user.id);
        if (error) {
          console.error('Error details:', error);
          throw error;
        }
        setOrders(data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
        setError(`Failed to load orders: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, navigate]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">
          You haven't placed any orders yet. Visit our shop to place your first order!
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Paper elevation={3} sx={{ 
              mt: { xs: 4, sm: 8 }, 
              p: { xs: 2, sm: 4 }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Order #{order.id.slice(0, 8)}
                </Typography>
                <Chip
                  label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  color={getStatusColor(order.status)}
                  variant="filled"
                />
              </Box>

              <Typography color="text.secondary" gutterBottom>
                Placed on {formatDate(order.created_at)}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Delivery Details:
                </Typography>
                <Typography>
                  Student: {order.user_profiles.student_name}
                </Typography>
                <Typography>
                  Class: {order.user_profiles.student_class}-{order.user_profiles.student_section}
                </Typography>
                <Typography gutterBottom>
                  GEMS ID: xxxxxx{order.user_profiles.gems_id_last_six}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Items:
                </Typography>
                {order.items.map((item, index) => (
                  <Typography key={index}>
                    {item.name} x {item.quantity} = AED {(item.price * item.quantity).toFixed(2)}
                  </Typography>
                ))}
              </Box>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                  Total: AED {order.total_amount.toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
