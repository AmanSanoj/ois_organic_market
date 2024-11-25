import { useEffect, useState } from 'react'
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { isAdmin } from '../services/supabase'

function Shop() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name')
        
        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Error loading products:', error)
        setError('Failed to load products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Redirect admin to dashboard
  useEffect(() => {
    if (user && isAdmin(user)) {
      navigate('/admin')
    }
  }, [user, navigate])

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mt: { xs: 4, sm: 8 }, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Products
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <ProductCard
              product={product}
              onAddToCart={addToCart}
              showAddToCart={!isAdmin(user)}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default Shop
