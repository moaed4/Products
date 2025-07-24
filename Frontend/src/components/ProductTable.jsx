import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField,
  CircularProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Box, MenuItem, Select,
  FormControl, InputLabel, Typography, Avatar, Chip,
  Tooltip, Divider, Badge, Skeleton, useMediaQuery, useTheme
} from '@mui/material';
import {
  Search, Add, Edit, Delete, Category, AttachMoney,
  Inventory, Info, Close, Check, Star, FilterList,
  Refresh, Save, Cancel, FirstPage, LastPage, ChevronLeft, ChevronRight
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { motion } from 'framer-motion';

// API Configuration
const API_BASE_URL = 'https://localhost:7005/api';
const PRODUCTS_API_URL = `${API_BASE_URL}/Products`;

// API Service Functions
const fetchProducts = async (params) => {
  try {
    const response = await axios.get(PRODUCTS_API_URL, {
      params: {
        page: params.pageNumber,
        pageSize: params.pageSize,
        sortColumn: params.sortBy,
        sortOrder: params.sortDescending ? 'desc' : 'asc',
        search: params.searchTerm,
        category: params.category
      }
    });

    return {
      items: response.data.data || [],
      totalCount: response.data.totalCount || 0
    };
  } catch (error) {
    throw error;
  }
};

const createProduct = async (productData) => {
  try {
    const response = await axios.post(PRODUCTS_API_URL, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(`${PRODUCTS_API_URL}/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteProduct = async (id) => {
  try {
    await axios.delete(`${PRODUCTS_API_URL}/${id}`);
    return true;
  } catch (error) {
    throw error;
  }
};

// Validation Schema
const productValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(100),
  description: Yup.string().required('Description is required').max(500),
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price must be positive')
    .max(1000000, 'Price is too high'),
  stockQuantity: Yup.number()
    .required('Stock quantity is required')
    .min(0, 'Stock must be positive')
    .integer('Stock must be a whole number'),
  category: Yup.string().required('Category is required')
});

// Category Configuration
const categories = [
  { value: 'Electronics', color: 'primary', icon: <Category /> },
  { value: 'Clothing', color: 'secondary', icon: <Inventory /> },
  { value: 'Food', color: 'success', icon: <AttachMoney /> },
  { value: 'Furniture', color: 'warning', icon: <Info /> },
  { value: 'Books', color: 'info', icon: <Star /> },
  { value: 'Other', color: 'error', icon: <FilterList /> }
];

// Color Scheme
const colors = {
  primary: '#6366F1',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  dark: '#1F2937',
  light: '#F3F4F6'
};

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

// Main Component
const ProductTable = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State Management
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    categories: {}
  });

  // Formik Configuration
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      category: ''
    },
    validationSchema: productValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        if (currentProduct) {
          await updateProduct(currentProduct.id, values);
          toast.success(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Check color="success" /> Product updated successfully!
            </motion.div>,
            { autoClose: 2000 }
          );
        } else {
          await createProduct(values);
          toast.success(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Check color="success" /> Product created successfully!
            </motion.div>,
            { autoClose: 2000 }
          );
        }
        handleCloseDialog();
        resetForm();
        loadProducts();
      } catch (error) {
        toast.error(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Close color="error" /> {error.response?.data?.message || 'Operation failed'}
          </motion.div>,
          { autoClose: 3000 }
        );
      } finally {
        setLoading(false);
      }
    }
  });

  // Load Products Data
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        pageNumber: page + 1,
        pageSize: rowsPerPage,
        searchTerm: searchTerm,
        sortBy: sortConfig.field,
        sortDescending: sortConfig.direction === 'desc',
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      };

      const { items, totalCount } = await fetchProducts(params);
      setProducts(items);
      setTotalCount(totalCount);

      // Calculate stats
      const totalStock = items.reduce((sum, product) => sum + product.stockQuantity, 0);
      const totalValue = items.reduce((sum, product) => sum + (product.price * product.stockQuantity), 0);

      const categoryCounts = items.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalProducts: totalCount,
        totalStock,
        totalValue,
        categories: categoryCounts
      });

      setInitialLoad(false);
    } catch (error) {
      toast.error(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Close color="error" /> Failed to load products
        </motion.div>,
        { autoClose: 3000 }
      );
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle Product Delete
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const confirmed = window.confirm('Are you sure you want to delete this product?');
      if (confirmed) {
        await deleteProduct(id);
        toast.success(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Check color="success" /> Product deleted successfully!
          </motion.div>,
          { autoClose: 2000 }
        );
        // Reset to first page if we're on a page that might now be empty
        if (products.length === 1 && page > 0) {
          setPage(page - 1);
        } else {
          loadProducts();
        }
      }
    } catch (error) {
      toast.error(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Close color="error" /> Failed to delete product
        </motion.div>,
        { autoClose: 3000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Dialog Open/Close
  const handleOpenDialog = (product = null) => {
    setCurrentProduct(product);
    if (product) {
      formik.setValues(product);
    } else {
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProduct(null);
    formik.resetForm();
  };

  // Handle Pagination Changes
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle Search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle Sort
  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
    setPage(0);
  };

  // Handle Category Filter
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setPage(0);
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 500); // Debounce to prevent rapid API calls

    return () => clearTimeout(timer);
  }, [page, rowsPerPage, searchTerm, sortConfig, selectedCategory]);

  // Render Sort Indicator
  const SortIndicator = ({ field }) => {
    if (sortConfig.field !== field) return null;
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'inline-flex', marginLeft: 4 }}
      >
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </motion.span>
    );
  };

  // Render Category Chip
  const CategoryChip = ({ category }) => {
    const cat = categories.find(c => c.value === category) || categories[categories.length - 1];
    return (
      <Chip
        size="small"
        icon={cat.icon}
        label={category}
        color={cat.color}
        variant="outlined"
        sx={{ borderRadius: 1, fontWeight: 500 }}
      />
    );
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(0, Math.min(page - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages));
      const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (

    <Box sx={{ p: isMobile ? 1 : 3 }}>

      {/* Header  */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Box sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2
        }}>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Product Dashboard
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh data">
              <IconButton onClick={loadProducts} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 4px 10px ${colors.primary}30`,
                '&:hover': {
                  boxShadow: `0 6px 14px ${colors.primary}50`
                }
              }}
            >
              New Product
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ staggerChildren: 0.1 }}
        style={{ marginBottom: 24 }}
      >
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 2,
          mb: 3
        }}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Products</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalCount}</Typography>
              <Inventory color="primary" />
            </Box>
            <Typography variant="caption" color="textSecondary">Across all categories</Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Stock</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.totalStock}</Typography>
              <Category color="secondary" />
            </Box>
            <Typography variant="caption" color="textSecondary">Items in inventory</Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Inventory Value</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>${stats.totalValue.toFixed(2)}</Typography>
              <AttachMoney color="success" />
            </Box>
            <Typography variant="caption" color="textSecondary">Current stock value</Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Categories</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{categories.length}</Typography>
              <FilterList color="warning" />
            </Box>
            <Typography variant="caption" color="textSecondary">Product categories</Typography>
          </Paper>
        </Box>
      </motion.div>

      {/* Search */}
      <motion.div initial="hidden" animate="visible" variants={slideUp}>
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            alignItems: 'center'
          }}>
            <TextField
              fullWidth
              label="Search Products"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <Search sx={{ color: 'text.secondary', mr: 1 }} />
                ),
                sx: { borderRadius: 2 }
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: colors.light
                  },
                  '&:hover fieldset': {
                    borderColor: colors.primary
                  }
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleCategoryFilter('all')}
                sx={{ borderRadius: 2 }}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'contained' : 'outlined'}
                  size="small"
                  color={category.color}
                  startIcon={category.icon}
                  onClick={() => handleCategoryFilter(category.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {category.value}
                </Button>
              ))}
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/*  Table */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {initialLoad ? (
            <Box sx={{ p: 3 }}>
              <Skeleton variant="rectangular" width="100%" height={400} animation="wave" />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: colors.light }}>
                    <TableRow>
                      <TableCell
                        sx={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => handleSort('name')}
                      >
                        Name <SortIndicator field="name" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => handleSort('price')}
                      >
                        Price <SortIndicator field="price" />
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => handleSort('stockQuantity')}
                      >
                        Stock <SortIndicator field="stockQuantity" />
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => handleSort('category')}
                      >
                        Category <SortIndicator field="category" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <TableRow
                          hover
                          key={product.id}
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                            '&:hover': { bgcolor: `${colors.primary}08` }
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={500}>{product.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {product.description.substring(0, 50)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`$${product.price.toFixed(2)}`}
                              color="success"
                              size="small"
                              variant="outlined"
                              icon={<AttachMoney fontSize="small" />}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              badgeContent={product.stockQuantity}
                              color={
                                product.stockQuantity > 50 ? 'success' :
                                  product.stockQuantity > 10 ? 'warning' : 'error'
                              }
                              sx={{ '& .MuiBadge-badge': { right: -10, top: 10 } }}
                            />
                          </TableCell>
                          <TableCell>
                            <CategoryChip category={product.category} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Edit" arrow>
                                <IconButton
                                  color="primary"
                                  onClick={() => handleOpenDialog(product)}
                                  size="small"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" arrow>
                                <IconButton
                                  color="error"
                                  onClick={() => handleDelete(product.id)}
                                  size="small"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Search sx={{ fontSize: 48, color: 'text.disabled' }} />
                            <Typography variant="h6" color="textSecondary">
                              No products found
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Try adjusting your search or filter criteria
                            </Typography>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('all');
                              }}
                              sx={{ mt: 2 }}
                            >
                              Reset Filters
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderTop: `1px solid ${colors.light}`,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 2 : 0
              }}>
                {/* Rows per page */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Rows per page:
                  </Typography>
                  <Select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      '& .MuiSelect-select': { py: 0.5 }
                    }}
                  >
                    {[5, 13, 21, 29, 37, 45].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>

                </Box>



                {/* Page numbers */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                    startIcon={<FirstPage />}

                    sx={{ minWidth: 32 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    startIcon={<ChevronLeft />}
                    sx={{ minWidth: 32 }}
                  />

                  {getPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={page === pageNumber ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setPage(pageNumber)}
                      sx={{
                        minWidth: 32,
                        fontWeight: page === pageNumber ? 600 : 400
                      }}
                    >
                      {pageNumber + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    startIcon={<ChevronRight />}
                    sx={{ minWidth: 32 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                    startIcon={<LastPage />}
                    sx={{ minWidth: 32 }}
                  />
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </motion.div>

      {/* Add/Edit function */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{
          bgcolor: colors.light,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight={600}>
            {currentProduct ? 'Edit Product' : 'Create New Product'}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ py: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '& .MuiTextField-root': { mb: 1 }
            }}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: formik.values.name && !formik.errors.name ? (
                    <Check color="success" />
                  ) : null
                }}
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                variant="outlined"
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price"
                  name="price"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  helperText={formik.touched.price && formik.errors.price}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <AttachMoney fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Stock Quantity"
                  name="stockQuantity"
                  value={formik.values.stockQuantity}
                  onChange={formik.handleChange}
                  error={formik.touched.stockQuantity && Boolean(formik.errors.stockQuantity)}
                  helperText={formik.touched.stockQuantity && formik.errors.stockQuantity}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <Inventory fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formik.values.category}
                  label="Category"
                  onChange={formik.handleChange}
                  error={formik.touched.category && Boolean(formik.errors.category)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {React.cloneElement(category.icon, { fontSize: 'small' })}
                        {category.value}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.category && formik.errors.category && (
                  <Typography color="error" variant="caption">
                    {formik.errors.category}
                  </Typography>
                )}
              </FormControl>

              {currentProduct && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Last updated: {new Date().toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${colors.light}`
          }}>
            <Button
              onClick={handleCloseDialog}
              color="inherit"
              variant="outlined"
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !formik.isValid}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 2px 6px ${colors.primary}30`,
                '&:hover': {
                  boxShadow: `0 4px 10px ${colors.primary}50`
                }
              }}
            >
              {loading ? 'Processing...' : 'Save Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProductTable;