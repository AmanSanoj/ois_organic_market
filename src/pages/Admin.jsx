import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { supabase, isAdmin, fixInvalidStockValues } from '../services/supabase'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function Admin() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    popularProducts: [],
    revenueByDay: [],
  })
  const [tabValue, setTabValue] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    image_url: '',
  })

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (!user) {
          setError('Please sign in to access the admin panel')
          navigate('/')
          return
        }

        if (!isAdmin(user)) {
          setError('You do not have admin privileges')
          navigate('/')
          return
        }

        // If we get here, user is an admin, start fetching data
        fetchData()
      } catch (error) {
        console.error('Auth error:', error)
        setError('Authentication error: ' + error.message)
        setLoading(false)
      }
    }

    checkAdmin()
  }, [navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fix any invalid stock values
      await fixInvalidStockValues()

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (productsError) throw productsError

      // Process analytics data
      const revenue = ordersData.reduce((sum, order) => sum + Number(order.total_amount), 0)
      const productCounts = {}
      const dailyRevenue = {}

      ordersData.forEach(order => {
        // Count products
        const items = order.items || []
        items.forEach(item => {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity
        })

        // Daily revenue
        const date = new Date(order.created_at).toLocaleDateString()
        dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(order.total_amount)
      })

      // Format data for charts
      const popularProducts = Object.entries(productCounts)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      const revenueByDay = Object.entries(dailyRevenue)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7)

      setOrders(ordersData)
      setProducts(productsData)
      setAnalytics({
        totalRevenue: revenue,
        totalOrders: ordersData.length,
        popularProducts,
        revenueByDay,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Error loading data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        image_url: product.image_url || '',
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        price: '',
        stock_quantity: '',
        image_url: '',
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
    setProductForm({
      name: '',
      price: '',
      stock_quantity: '',
      image_url: '',
    })
  }

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (deleteError) throw deleteError;

      // Refresh products list
      const { data: productsData, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      setProducts(productsData);
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product: ' + error.message);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const productData = {
        name: productForm.name,
        price: parseFloat(productForm.price),
        stock_quantity: parseInt(productForm.stock_quantity, 10),
        image_url: productForm.image_url,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
      }

      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving product:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value })
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {!user && (
          <Button variant="contained" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Dashboard" />
          <Tab label="Products" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  AED {analytics.totalRevenue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {analytics.totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Popular Products
              </Typography>
              <PieChart width={400} height={300}>
                <Pie
                  data={analytics.popularProducts}
                  dataKey="quantity"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.popularProducts.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue by Day (Last 7 Days)
              </Typography>
              <BarChart width={400} height={300} data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" name="Revenue" fill="#8884d8" />
              </BarChart>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                await fixInvalidStockValues()
                // Refresh the products list
                const { data, error } = await supabase
                  .from('products')
                  .select('*')
                  .order('name')
                if (error) throw error
                setProducts(data)
              } catch (error) {
                console.error('Error fixing stock:', error)
                setError('Failed to fix stock values: ' + error.message)
              }
            }}
          >
            Fix Stock Issues
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Price (AED)</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{product.price.toFixed(2)} AED</TableCell>
                  <TableCell align="right">{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton onClick={() => handleOpenDialog(product)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(product)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>GEMS ID</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total Amount (AED)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.student_name}</TableCell>
                  <TableCell>{order.class_name}</TableCell>
                  <TableCell>{order.gems_id_last_six}</TableCell>
                  <TableCell>
                    {(order.items || []).map(item => 
                      `${item.name} (${item.quantity})`
                    ).join(', ')}
                  </TableCell>
                  <TableCell align="right">{order.total_amount.toFixed(2)} AED</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {editingProduct 
              ? 'Edit the product details below.' 
              : 'Fill in the product details below to create a new product.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            name="name"
            value={productForm.name}
            onChange={handleFormChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Price (AED)"
            name="price"
            type="number"
            value={productForm.price}
            onChange={handleFormChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Stock Quantity"
            name="stock_quantity"
            type="number"
            value={productForm.stock_quantity}
            onChange={handleFormChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Image URL"
            name="image_url"
            value={productForm.image_url}
            onChange={handleFormChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Admin
