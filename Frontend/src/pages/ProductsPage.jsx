import { useState, useEffect } from 'react'
import { Grid, Box, Typography, CircularProgress } from '@mui/material'
import DataCard from '../components/DataCard'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts([
        { id: 1, name: 'Product A', description: 'Description A', price: 29.99 },
        { id: 2, name: 'Product B', description: 'Description B', price: 49.99 }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Our Products</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <DataCard item={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}