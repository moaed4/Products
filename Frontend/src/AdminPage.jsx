import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import ItemFormDialog from '../components/ItemFormDialog'

export default function AdminPage() {
  const { user } = useUser()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      setTimeout(() => {
        setProducts([
          { id: 1, name: 'Product A', price: 29.99, stock: 100, category: 'Electronics' },
          { id: 2, name: 'Product B', price: 49.99, stock: 50, category: 'Clothing' }
        ])
        setLoading(false)
      }, 1000)
    }
    fetchProducts()
  }, [])

  const handleAddProduct = () => {
    setCurrentProduct(null)
    setOpenDialog(true)
  }

  const handleEditProduct = (product) => {
    setCurrentProduct(product)
    setOpenDialog(true)
  }

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id))
  }

  const handleSubmit = (productData) => {
    if (productData.id) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === productData.id ? productData : p
      ))
    } else {
      // Add new product
      setProducts([...products, { ...productData, id: Date.now() }])
    }
    setOpenDialog(false)
  }

  if (!user || user.publicMetadata.role !== 'admin') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Unauthorized Access</Typography>
        <Typography>Admin privileges required</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                  <TableCell align="right">{product.stock}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEditProduct(product)}>
                      <Edit color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteProduct(product.id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ItemFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        initialValues={currentProduct}
      />
    </Box>
  )
}