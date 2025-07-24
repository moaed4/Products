import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, CardContent, CardMedia, Typography, 
  TextField, Pagination, Select, MenuItem, FormControl, 
  InputLabel, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Chip, Slider, Checkbox, 
  FormGroup, FormControlLabel, CircularProgress, Alert,
  Snackbar, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper
} from '@mui/material';
import { 
  Search, Close, Edit, Delete, ExpandMore, 
  ExpandLess, FilterAlt, Check, Clear, Add 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ProductService from './ProductService';

const ProductManagement = () => {
  // State for products and pagination
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0
  });
  
  // State for filters and sorting
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    minStock: 0,
    maxStock: 1000,
    sortBy: 'Name',
    sortDescending: false
  });
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [mode, setMode] = useState('add'); // 'add' or 'edit'
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Categories for filter
  const categories = ['Electronics', 'Furniture', 'Clothing', 'Kitchen', 'Other'];

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        ...filters,
        pageNumber: pagination.page,
        pageSize: pagination.pageSize
      };
      
      const data = await ProductService.getProducts(queryParams);
      setProducts(data.items);
      setPagination(prev => ({
        ...prev,
        totalItems: data.totalItems
      }));
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.pageSize, filters]);

  // Handle pagination change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  // Handle search input
  const handleSearchChange = (event) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: event.target.value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle sort change
  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortDescending: prev.sortBy === column ? !prev.sortDescending : false
    }));
  setPagination(prev => ({
    ...prev,
    page: 1
  }));
};

  // Open add product modal
  const handleAddProduct = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: 0,
      category: '',
      stockQuantity: 0,
      image: ''
    });
    setMode('add');
    setModalOpen(true);
  };

  // Open edit product modal
  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setMode('edit');
    setModalOpen(true);
  };

  // Open product details modal
  const handleViewProduct = (product) => {
    setCurrentProduct(product);
    setDetailModalOpen(true);
  };

  // Handle product form submit
  const handleSubmitProduct = async () => {
    try {
      if (mode === 'add') {
        await ProductService.createProduct(currentProduct);
        setSnackbar({
          open: true,
          message: 'Product added successfully',
          severity: 'success'
        });
      } else {
        await ProductService.updateProduct(currentProduct.id, currentProduct);
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success'
        });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to ${mode === 'add' ? 'add' : 'update'} product`,
        severity: 'error'
      });
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} product:`, err);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await ProductService.deleteProduct(id);
        setSnackbar({
          open: true,
          message: 'Product deleted successfully',
          severity: 'success'
        });
        fetchProducts();
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to delete product',
          severity: 'error'
        });
        console.error('Error deleting product:', err);
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      category: '',
      minPrice: 0,
      maxPrice: 1000,
      minStock: 0,
      maxStock: 1000,
      sortBy: 'Name',
      sortDescending: false
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header and Actions */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1">
          Product Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Box>

      {/* Search and Filter Controls */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <TextField
          variant="outlined"
          placeholder="Search products..."
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
          }}
          value={filters.searchTerm}
          onChange={handleSearchChange}
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category}
            label="Category"
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          startIcon={<FilterAlt />}
          onClick={() => setFilterModalOpen(true)}
        >
          Advanced Filters
        </Button>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={filters.sortBy}
            label="Sort By"
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <MenuItem value="Name">Name</MenuItem>
            <MenuItem value="Price">Price</MenuItem>
            <MenuItem value="Category">Category</MenuItem>
            <MenuItem value="StockQuantity">Stock</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          endIcon={filters.sortDescending ? <ExpandMore /> : <ExpandLess />}
          onClick={() => handleFilterChange('sortDescending', !filters.sortDescending)}
        >
          {filters.sortDescending ? 'Descending' : 'Ascending'}
        </Button>
      </Box>

      {/* Active Filters */}
      {(filters.category || 
       filters.minPrice > 0 || 
       filters.maxPrice < 1000 ||
       filters.minStock > 0 ||
       filters.maxStock < 1000) && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.category && (
            <Chip 
              label={`Category: ${filters.category}`}
              onDelete={() => handleFilterChange('category', '')}
              deleteIcon={<Close />}
            />
          )}
          {filters.minPrice > 0 && (
            <Chip 
              label={`Min Price: $${filters.minPrice}`}
              onDelete={() => handleFilterChange('minPrice', 0)}
              deleteIcon={<Close />}
            />
          )}
          {filters.maxPrice < 1000 && (
            <Chip 
              label={`Max Price: $${filters.maxPrice}`}
              onDelete={() => handleFilterChange('maxPrice', 1000)}
              deleteIcon={<Close />}
            />
          )}
          {filters.minStock > 0 && (
            <Chip 
              label={`Min Stock: ${filters.minStock}`}
              onDelete={() => handleFilterChange('minStock', 0)}
              deleteIcon={<Close />}
            />
          )}
          {filters.maxStock < 1000 && (
            <Chip 
              label={`Max Stock: ${filters.maxStock}`}
              onDelete={() => handleFilterChange('maxStock', 1000)}
              deleteIcon={<Close />}
            />
          )}
        </Box>
      )}

      {/* Loading and Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          <Grid container spacing={3}>
            {products.map(product => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={product.image || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    onClick={() => handleViewProduct(product)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {product.category} • {product.stockQuantity} in stock
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${product.price.toFixed(2)}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<Delete />}
                        color="error"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 3 
          }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rows per page</InputLabel>
              <Select
                value={pagination.pageSize}
                label="Rows per page"
                onChange={handleRowsPerPageChange}
              >
                {[5, 10, 25, 50].map(value => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography>
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
              {pagination.totalItems} products
            </Typography>
            
            <Pagination
              count={Math.ceil(pagination.totalItems / pagination.pageSize)}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Product Form Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          <IconButton
            aria-label="close"
            onClick={() => setModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Product Name"
                  name="name"
                  value={currentProduct?.name || ''}
                  onChange={(e) => setCurrentProduct(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={currentProduct?.description || ''}
                  onChange={(e) => setCurrentProduct(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Image URL"
                  name="image"
                  value={currentProduct?.image || ''}
                  onChange={(e) => setCurrentProduct(prev => ({
                    ...prev,
                    image: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={currentProduct?.price || 0}
                  onChange={(e) => setCurrentProduct(prev => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0
                  }))}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Stock Quantity"
                  name="stockQuantity"
                  type="number"
                  value={currentProduct?.stockQuantity || 0}
                  onChange={(e) => setCurrentProduct(prev => ({
                    ...prev,
                    stockQuantity: parseInt(e.target.value) || 0
                  }))}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    name="category"
                    value={currentProduct?.category || ''}
                    onChange={(e) => setCurrentProduct(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                  >
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitProduct} variant="contained">
            {mode === 'add' ? 'Add Product' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentProduct?.name}
          <IconButton
            aria-label="close"
            onClick={() => setDetailModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <CardMedia
                component="img"
                height="400"
                image={currentProduct?.image || 'https://via.placeholder.com/300'}
                alt={currentProduct?.name}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                {currentProduct?.name}
              </Typography>
              <Chip 
                label={currentProduct?.category} 
                color="primary" 
                size="small" 
                sx={{ mb: 2 }}
              />
              <Typography variant="h4" color="primary" gutterBottom>
                ${currentProduct?.price?.toFixed(2)}
              </Typography>
              <Typography variant="body1" paragraph>
                {currentProduct?.description}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Stock:</strong> {currentProduct?.stockQuantity} available
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Last updated: {new Date(currentProduct?.updatedAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDetailModalOpen(false)} 
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Advanced Filters</Typography>
            <Box>
              <Button 
                startIcon={<Clear />} 
                onClick={handleResetFilters}
                sx={{ mr: 1 }}
              >
                Reset
              </Button>
              <Button 
                startIcon={<Check />} 
                onClick={() => setFilterModalOpen(false)}
                variant="contained"
              >
                Apply
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={3}>
            <Typography gutterBottom>Price Range</Typography>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onChange={(e, newValue) => {
                handleFilterChange('minPrice', newValue[0]);
                handleFilterChange('maxPrice', newValue[1]);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={1000}
              step={10}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">${filters.minPrice}</Typography>
              <Typography variant="caption">${filters.maxPrice}</Typography>
            </Box>
          </Box>
          
          <Box mb={3}>
            <Typography gutterBottom>Stock Range</Typography>
            <Slider
              value={[filters.minStock, filters.maxStock]}
              onChange={(e, newValue) => {
                handleFilterChange('minStock', newValue[0]);
                handleFilterChange('maxStock', newValue[1]);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={1000}
              step={1}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">{filters.minStock}</Typography>
              <Typography variant="caption">{filters.maxStock}</Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography gutterBottom>Categories</Typography>
            <FormGroup>
              {categories.map(category => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox 
                      checked={filters.category === category}
                      onChange={() => handleFilterChange('category', 
                        filters.category === category ? '' : category)}
                    />
                  }
                  label={category}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManagement;