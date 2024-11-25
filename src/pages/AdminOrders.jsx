import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  Snackbar,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import { Visibility, Print } from '@mui/icons-material'
import { supabase, isAdmin, updateOrderStatus } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled']
const STATUS_ORDER = {
  'pending': 0,
  'confirmed': 1,
  'delivered': 2,
  'cancelled': 3
}

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'info'
    case 'delivered':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusBgColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#fff3e0'  // Light orange
    case 'confirmed':
      return '#e3f2fd'  // Light blue
    case 'delivered':
      return '#e8f5e9'  // Light green
    case 'cancelled':
      return '#ffebee'  // Light red
    default:
      return '#f5f5f5'  // Light grey
  }
}

const getStatusTextColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#ed6c02'  // Orange
    case 'confirmed':
      return '#0288d1'  // Blue
    case 'delivered':
      return '#2e7d32'  // Green
    case 'cancelled':
      return '#d32f2f'  // Red
    default:
      return '#757575'  // Grey
  }
}

const StatusMenuItem = ({ status }) => (
  <Box
    sx={{
      width: '100%',
      py: 1,
      px: 2,
      backgroundColor: getStatusBgColor(status),
      color: getStatusTextColor(status),
      '&:hover': {
        backgroundColor: getStatusBgColor(status),
        filter: 'brightness(0.95)',
      }
    }}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Box>
)

const StatusDisplay = ({ status }) => (
  <Box
    sx={{
      py: 0.5,
      px: 1,
      backgroundColor: getStatusBgColor(status),
      color: getStatusTextColor(status),
      borderRadius: 1,
      display: 'inline-block',
      minWidth: 90,
      textAlign: 'center'
    }}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Box>
)

function OrderDetailsDialog({ open, onClose, order }) {
  if (!order) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Order Details
        <Typography variant="subtitle2" color="text.secondary">
          Order ID: {order.id}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Ordered Items</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">AED {item.price}</TableCell>
                      <TableCell align="right">AED {item.quantity * item.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Divider />
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Student Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography>{order.student_name}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                <Typography>{order.class_name}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">GEMS ID</Typography>
                <Typography>{order.gems_id_last_six}</Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Parent Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography>{order.user_profiles?.parent_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography>{order.user_profiles?.parent_email}</Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Order Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <StatusDisplay status={order.status} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                <Typography>AED {order.total_amount}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Order Date</Typography>
                <Typography>{new Date(order.created_at).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function AdminOrders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [orderBy, setOrderBy] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // Filter orders based on status
  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' ? true : order.status === statusFilter
  )

  useEffect(() => {
    const checkAdmin = async () => {
      try {
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

        fetchData()
      } catch (error) {
        console.error('Auth error:', error)
        setError('Authentication error: ' + error.message)
        setLoading(false)
      }
    }

    checkAdmin()
  }, [navigate, user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          user_profiles (
            student_name,
            student_class,
            student_section,
            gems_id_last_six,
            parent_name,
            parent_email
          )
        `)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Orders fetch error:', ordersError)
        throw ordersError
      }

      console.log('Raw orders data:', ordersData)

      // Format the joined data
      let formattedOrders = ordersData.map(order => ({
        ...order,
        student_name: order.user_profiles?.student_name || 'N/A',
        class_name: order.user_profiles ? `${order.user_profiles.student_class}-${order.user_profiles.student_section}` : 'N/A',
        gems_id_last_six: order.user_profiles?.gems_id_last_six || 'N/A'
      }))

      // Sort the data
      formattedOrders.sort((a, b) => {
        let comparison = 0
        
        switch (orderBy) {
          case 'student_name':
            comparison = a.student_name.localeCompare(b.student_name)
            break
          case 'class_name':
            comparison = a.class_name.localeCompare(b.class_name)
            break
          case 'gems_id_last_six':
            comparison = a.gems_id_last_six.localeCompare(b.gems_id_last_six)
            break
          case 'total_amount':
            comparison = a.total_amount - b.total_amount
            break
          case 'status':
            comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
            break
          case 'created_at':
            comparison = new Date(a.created_at) - new Date(b.created_at)
            break
          default:
            comparison = 0
        }

        return order === 'desc' ? -comparison : comparison
      })

      setOrders(formattedOrders)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Error loading data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await updateOrderStatus(orderId, newStatus)
      if (error) throw error

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))

      setSnackbar({
        open: true,
        message: 'Order status updated successfully',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating status:', error)
      setSnackbar({
        open: true,
        message: 'Failed to update order status: ' + error.message,
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
    fetchData()
  }

  const createSortHandler = (property) => () => {
    handleRequestSort(property)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    // Create a simplified version of the table for printing
    const table = document.getElementById('orders-table');
    const printTable = table.cloneNode(true);
    
    // Remove sorting arrows and no-print elements
    printTable.querySelectorAll('.MuiTableSortLabel-icon').forEach(el => el.remove());
    printTable.querySelectorAll('.no-print').forEach(el => el.remove());
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orders Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
            .status-cell {
              padding: 4px 8px;
              border-radius: 4px;
              display: inline-block;
              min-width: 90px;
              text-align: center;
            }
            .status-pending {
              background-color: #fff3e0;
              color: #ed6c02;
            }
            .status-confirmed {
              background-color: #e3f2fd;
              color: #0288d1;
            }
            .status-delivered {
              background-color: #e8f5e9;
              color: #2e7d32;
            }
            .status-cancelled {
              background-color: #ffebee;
              color: #d32f2f;
            }
            .no-print, .MuiTableSortLabel-icon {
              display: none !important;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <h2>Orders Report - ${new Date().toLocaleDateString()}</h2>
          ${printTable.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

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
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
      <Paper elevation={3} sx={{ 
        mt: { xs: 4, sm: 8 }, 
        p: { xs: 2, sm: 4 }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Manage Orders</Typography>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print Table
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 3, mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">Filter by status:</Typography>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ 
              minWidth: 120,
              '& .MuiSelect-select': {
                py: 0.5,
                bgcolor: statusFilter !== 'all' ? getStatusBgColor(statusFilter) : 'transparent',
              }
            }}
            renderValue={(value) => (
              value === 'all' ? (
                <Typography>All Orders</Typography>
              ) : (
                <StatusDisplay status={value} />
              )
            )}
          >
            <MenuItem value="all">All Orders</MenuItem>
            {ORDER_STATUSES.map((status) => (
              <MenuItem 
                key={status} 
                value={status}
                sx={{ p: 0 }}
              >
                <StatusMenuItem status={status} />
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Showing {filteredOrders.length} orders
          </Typography>
        </Box>

        <TableContainer component={Paper}>
          <Table id="orders-table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'asc'}
                    onClick={createSortHandler('id')}
                  >
                    Order ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'student_name'}
                    direction={orderBy === 'student_name' ? order : 'asc'}
                    onClick={createSortHandler('student_name')}
                  >
                    Student Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'class_name'}
                    direction={orderBy === 'class_name' ? order : 'asc'}
                    onClick={createSortHandler('class_name')}
                  >
                    Class
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'gems_id_last_six'}
                    direction={orderBy === 'gems_id_last_six' ? order : 'asc'}
                    onClick={createSortHandler('gems_id_last_six')}
                  >
                    GEMS ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'created_at'}
                    direction={orderBy === 'created_at' ? order : 'asc'}
                    onClick={createSortHandler('created_at')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell className="no-print">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.student_name}</TableCell>
                  <TableCell>{order.class_name}</TableCell>
                  <TableCell>{order.gems_id_last_six}</TableCell>
                  <TableCell>AED {order.total_amount}</TableCell>
                  <TableCell>
                    <div className={`status-cell status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="no-print">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        size="small"
                        sx={{ 
                          minWidth: 120,
                          '& .MuiSelect-select': {
                            py: 0.5,
                            bgcolor: getStatusBgColor(order.status),
                          }
                        }}
                        renderValue={(value) => (
                          <StatusDisplay status={value} />
                        )}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <MenuItem 
                            key={status} 
                            value={status}
                            sx={{ p: 0 }}
                          >
                            <StatusMenuItem status={status} />
                          </MenuItem>
                        ))}
                      </Select>
                      <IconButton 
                        size="small" 
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <OrderDetailsDialog
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      </Paper>
    </Container>
  )
}

export default AdminOrders
