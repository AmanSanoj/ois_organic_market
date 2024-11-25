import { useEffect, useState } from 'react'
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { isAdmin } from '../services/supabase'

function Shop() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('Loading products...')
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name')
        
        console.log('Products response:', { data, error })
        
        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Error loading products:', error)
        setError('Failed to load products: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    // Only redirect admin after auth is confirmed
    if (!authLoading && user && isAdmin(user)) {
      console.log('Redirecting admin to dashboard...')
      navigate('/admin')
    }
  }, [authLoading, user, navigate])

  if (loading || authLoading) {
    console.log('Shop is loading:', { loading, authLoading })
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    console.error('Shop error:', error)
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    )
  }

  console.log('Rendering shop with products:', products)
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Available Products
        </Typography>
        {!user && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/login')}
          >
            Sign In to Shop
          </Button>
        )}
      </Box>
      
      {products.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No products available at the moment.
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {products.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default Shop
