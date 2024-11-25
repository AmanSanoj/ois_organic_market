import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
  Box,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'

function ProductCard({ product }) {
  const { name, price, image_url, stock_quantity } = product;
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  // Check if we have stock
  const hasStock = stock_quantity > 0;
  
  // Get stock level indicator
  const getStockLevel = () => {
    if (stock_quantity <= 0) return 'Out of Stock';
    if (stock_quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  // Get color for stock level
  const getStockColor = () => {
    if (stock_quantity <= 0) return 'error.main';
    if (stock_quantity < 10) return 'warning.main';
    return 'success.main';
  };

  const handleIncrement = () => {
    if (quantity < stock_quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={image_url || 'https://via.placeholder.com/200'}
        alt={name}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {name}
        </Typography>
        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
          {price.toFixed(2)} AED
        </Typography>
        <Typography variant="body2" color={getStockColor()}>
          {getStockLevel()}
        </Typography>
      </CardContent>
      <CardActions>
        {hasStock ? (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ mx: 2 }}>{quantity}</Typography>
              <IconButton
                size="small"
                onClick={handleIncrement}
                disabled={quantity >= stock_quantity}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              onClick={handleAddToCart}
              sx={{ ml: 'auto' }}
              size="small"
            >
              Add to Cart
            </Button>
          </Box>
        ) : (
          <Button 
            size="small" 
            color="primary" 
            disabled
            fullWidth
          >
            Out of Stock
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default ProductCard
