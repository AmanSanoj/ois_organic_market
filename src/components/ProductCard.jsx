import { useState } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
  Box,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import StockStatus from './StockStatus'

function ProductCard({ product, onAddToCart, showAddToCart = true }) {
  const { name, price, image_url, stock_quantity } = product
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const hasStock = stock_quantity > 0

  const handleIncrement = () => {
    if (quantity < stock_quantity) {
      setQuantity(prev => prev + 1)
    }
  }

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1))
  }

  const handleAddToCart = () => {
    onAddToCart(product, quantity)
    setQuantity(1)
    setShowSuccess(true)
  }

  return (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <CardMedia
        component="img"
        image={image_url || 'https://via.placeholder.com/200'}
        alt={name}
        sx={{
          height: 200,
          objectFit: 'cover',
          width: '100%',
          backgroundColor: 'background.paper',
        }}
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {name}
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          AED {price.toFixed(2)}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <StockStatus quantity={stock_quantity} />
        </Box>
      </CardContent>

      {showAddToCart && hasStock && (
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <IconButton 
                size="small"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>
              <Typography>
                {quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={handleIncrement}
                disabled={quantity >= stock_quantity}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddToCart}
              disabled={!hasStock}
            >
              Add to Cart
            </Button>
          </Box>
        </CardActions>
      )}

      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSuccess(false)}
        message="Added to cart"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Card>
  )
}

export default ProductCard
