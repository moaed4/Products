import React, { useState, useEffect, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField,
  CircularProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Box, MenuItem, Select,
  FormControl, InputLabel, Typography, Chip,
  Tooltip, Badge, Skeleton, useMediaQuery, useTheme,
  Switch, FormControlLabel, Snackbar, Alert
} from '@mui/material';
import {
  Search, Add, Edit, Delete, Category, AttachMoney,
  Inventory, Close, Check, FilterList,
  Refresh, Save, Cancel, FirstPage, LastPage, ChevronLeft, ChevronRight,
  RestoreFromTrash, Visibility, VisibilityOff
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { motion } from 'framer-motion';

// Constants
const API_BASE_URL = 'https://localhost:7005/api';
const PRODUCTS_API_URL = `${API_BASE_URL}/Products`;

const categories = [
  { value: 'Electronics', color: 'primary', icon: '📱' },
  { value: 'Clothing', color: 'secondary', icon: '👕' },
  { value: 'Food', color: 'success', icon: '🍎' },
  { value: 'Furniture', color: 'warning', icon: '🪑' },
  { value: 'Books', color: 'info', icon: '📚' },
  { value: 'Other', color: 'error', icon: '📦' }
];

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

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

// Product Service with proper error handling and cancellation
const productService = {
  fetchProducts: async (params, cancelToken) => {
    try {
      const response = await axios.get(PRODUCTS_API_URL, {
        params: {
          page: params.pageNumber,
          pageSize: params.pageSize,
          sortColumn: params.sortBy,
          sortOrder: params.sortDescending ? 'desc' : 'asc',
          search: params.searchTerm,
          category: params.category,
          isActive: params.isActive,
          includeDeleted: params.includeDeleted
        },
        cancelToken: cancelToken?.token
      });
      return {
        items: response.data.data || [],
        totalCount: response.data.totalCount || 0
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { items: [], totalCount: 0 };
      }
      throw error;
    }
  },

  fetchStats: async (includeDeleted = false, cancelToken) => {
    try {
      const response = await axios.get(`${PRODUCTS_API_URL}/Stats/Summary`, {
        params: { includeDeleted },
        cancelToken: cancelToken?.token
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return {};
      }
      throw error;
    }
  },

  createProduct: async (productData, cancelToken) => {
    try {
      const response = await axios.post(PRODUCTS_API_URL, productData, {
        cancelToken: cancelToken?.token,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return null;
      }
      throw error;
    }
  },

  updateProduct: async (id, productData, cancelToken) => {
    try {
      const payload = {
        ...productData,
        id: id  // Ensure ID matches the URL parameter
      };
      
      const response = await axios.put(`${PRODUCTS_API_URL}/${id}`, payload, {
        cancelToken: cancelToken?.token,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return null;
      }
      throw error;
    }
  },

  deleteProduct: async (id, cancelToken) => {
    try {
      await axios.delete(`${PRODUCTS_API_URL}/${id}`, {
        cancelToken: cancelToken?.token
      });
      return true;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return false;
      }
      throw error;
    }
  },

  setProductActiveStatus: async (id, isActive, cancelToken) => {
    try {
      const response = await axios.patch(`${PRODUCTS_API_URL}/${id}/SetActive`, { isActive }, {
        cancelToken: cancelToken?.token
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return null;
      }
      throw error;
    }
  },

  restoreProduct: async (id, cancelToken) => {
    try {
      const response = await axios.patch(`${PRODUCTS_API_URL}/${id}/Restore`, null, {
        cancelToken: cancelToken?.token
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return null;
      }
      throw error;
    }
  }
};

// Validation Schema
const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(100),
  description: Yup.string().required('Description is required').max(500),
  price: Yup.number()
    .required('Price is required')
    .min(0.01, 'Price must be at least 0.01')
    .max(1000000, 'Price is too high'),
  stockQuantity: Yup.number()
    .required('Stock quantity is required')
    .min(0, 'Stock must be positive')
    .integer('Stock must be a whole number'),
  category: Yup.string().required('Category is required')
});

const ProductTable = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cancelToken = useRef();

  // State
  const [state, setState] = useState({
    products: [],
    totalCount: 0,
    loading: false,
    initialLoad: true,
    page: 0,
    rowsPerPage: 10,
    searchTerm: '',
    openDialog: false,
    currentProduct: null,
    sortConfig: { field: 'name', direction: 'asc' },
    selectedCategory: 'all',
    filters: {
      isActive: null,
      includeDeleted: false
    },
    stats: {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      totalCategories: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      deletedProducts: 0
    },
    actionLoading: {
      edit: null,
      delete: null,
      refresh: false,
      toggleActive: null,
      restore: null
    },
    notification: {
      open: false,
      message: '',
      severity: 'success'
    }
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      category: '',
      isActive: true,
      isDeleted: false
    },
    validationSchema,
    onSubmit: handleSubmit
  });

  // Handlers
  async function handleSubmit(values, { resetForm }) {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      if (state.currentProduct) {
        await productService.updateProduct(state.currentProduct.id, values);
        showNotification('Product updated successfully!', 'success');
      } else {
        await productService.createProduct(values);
        showNotification('Product created successfully!', 'success');
      }
      
      handleCloseDialog();
      resetForm();
      loadData();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Operation failed', 
        'error'
      );
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }

  async function handleDelete(id) {
    try {
      setState(prev => ({ 
        ...prev, 
        actionLoading: { ...prev.actionLoading, delete: id } 
      }));
      
      const confirmed = window.confirm('Are you sure you want to delete this product?');
      if (confirmed) {
        await productService.deleteProduct(id);
        showNotification('Product deleted successfully!', 'success');
        loadData();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Failed to delete product', 
        'error'
      );
    } finally {
      setState(prev => ({ 
        ...prev, 
        actionLoading: { ...prev.actionLoading, delete: null } 
      }));
    }
  }


  async function handleRestore(id) {
    try {
      setState(prev => ({ 
        ...prev, 
        actionLoading: { ...prev.actionLoading, restore: id } 
      }));
      
      await productService.restoreProduct(id);
      showNotification('Product restored successfully!', 'success');
      loadData();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Failed to restore product', 
        'error'
      );
    } finally {
      setState(prev => ({ 
        ...prev, 
        actionLoading: { ...prev.actionLoading, restore: null } 
      }));
    }
  }

  function handleOpenDialog(product = null) {
    setState(prev => ({ 
      ...prev, 
      currentProduct: product,
      openDialog: true 
    }));
    
    if (product) {
      formik.setValues({
        name: product.name,
        description: product.description,
        price: product.price,
        stockQuantity: product.stockQuantity,
        category: product.category,
        isActive: product.isActive,
        isDeleted: product.isDeleted
      });
    } else {
      formik.resetForm();
    }
  }

  function handleCloseDialog() {
    setState(prev => ({ ...prev, openDialog: false, currentProduct: null }));
    formik.resetForm();
  }

  function showNotification(message, severity) {
    setState(prev => ({
      ...prev,
      notification: {
        open: true,
        message,
        severity
      }
    }));
  }

  function handleCloseNotification() {
    setState(prev => ({
      ...prev,
      notification: {
        ...prev.notification,
        open: false
      }
    }));
  }

  // Data Loading
  async function loadData() {
    try {
      // Cancel previous request if it exists
      if (cancelToken.current) {
        cancelToken.current.cancel('Operation canceled due to new request');
      }
      
      // Create new cancel token
      cancelToken.current = axios.CancelToken.source();
      
      setState(prev => ({ ...prev, loading: true }));
      
      const [productsData, statsData] = await Promise.all([
        productService.fetchProducts({
          pageNumber: state.page + 1,
          pageSize: state.rowsPerPage,
          searchTerm: state.searchTerm,
          sortBy: state.sortConfig.field,
          sortDescending: state.sortConfig.direction === 'desc',
          category: state.selectedCategory !== 'all' ? state.selectedCategory : undefined,
          isActive: state.filters.isActive,
          includeDeleted: state.filters.includeDeleted
        }, cancelToken.current),
        productService.fetchStats(state.filters.includeDeleted, cancelToken.current)
      ]);

      setState(prev => ({
        ...prev,
        products: productsData.items,
        totalCount: productsData.totalCount,
        stats: {
          totalProducts: statsData.totalProducts,
          totalStock: statsData.totalStock,
          totalValue: statsData.totalValue,
          totalCategories: statsData.totalCategories,
          activeProducts: statsData.activeProducts,
          inactiveProducts: statsData.inactiveProducts,
          deletedProducts: statsData.deletedProducts
        },
        initialLoad: false
      }));
    } catch (error) {
      if (!axios.isCancel(error)) {
        showNotification('Failed to load data', 'error');
        setState(prev => ({
          ...prev,
          products: [],
          totalCount: 0
        }));
      }
    } finally {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        actionLoading: { ...prev.actionLoading, refresh: false }
      }));
    }
  }

  // Clean up cancel token on unmount
  useEffect(() => {
    return () => {
      if (cancelToken.current) {
        cancelToken.current.cancel('Component unmounted');
      }
    };
  }, []);

  // Load data when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    state.page, 
    state.rowsPerPage, 
    state.searchTerm, 
    state.sortConfig, 
    state.selectedCategory,
    state.filters.isActive,
    state.filters.includeDeleted
  ]);

  // Components
  function SortIndicator({ field }) {
    if (state.sortConfig.field !== field) return null;
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'inline-flex', marginLeft: 4 }}
      >
        {state.sortConfig.direction === 'asc' ? '↑' : '↓'}
      </motion.span>
    );
  }

  function CategoryChip({ category }) {
    const cat = categories.find(c => c.value === category) || categories[categories.length - 1];
    return (
      <Chip
        size="small"
        label={<>{cat.icon} {category}</>}
        color={cat.color}
        variant="outlined"
        sx={{ borderRadius: 1, fontWeight: 500 }}
      />
    );
  }

  function StatusBadge({ isActive, isDeleted }) {
    if (isDeleted) {
      return (
        <Chip
          size="small"
          label="Deleted"
          color="error"
          icon={<Delete fontSize="small" />}
          sx={{ borderRadius: 1 }}
        />
      );
    }
    return (
      <Chip
        size="small"
        label={isActive ? 'Active' : 'Inactive'}
        color={isActive ? 'success' : 'warning'}
        icon={isActive ? <Check fontSize="small" /> : <Close fontSize="small" />}
        sx={{ borderRadius: 1 }}
      />
    );
  }

  const totalPages = Math.ceil(state.totalCount / state.rowsPerPage);

  function getPageNumbers() {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(0, Math.min(state.page - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages));
      const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  function StatsSkeleton() {
    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: 2,
        mb: 3
      }}>
        {[1, 2, 3, 4].map((item) => (
          <Paper key={item} elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Skeleton variant="text" width={50} height={40} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
            <Skeleton variant="text" width="80%" height={20} />
          </Paper>
        ))}
      </Box>
    );
  }

  function TableSkeleton() {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['Name', 'Description', 'Price', 'Stock', 'Category', 'Status', 'Actions'].map((header) => (
                <TableCell key={header}>
                  <Skeleton variant="text" width="80%" height={24} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: state.rowsPerPage }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton variant="text" /></TableCell>
                <TableCell><Skeleton variant="text" /></TableCell>
                <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* Header */}
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
              <IconButton
                onClick={() => {
                  setState(prev => ({ ...prev, actionLoading: { ...prev.actionLoading, refresh: true } }));
                  loadData();
                }}
                disabled={state.actionLoading.refresh}
                sx={{
                  border: `1px solid ${colors.light}`,
                  borderRadius: 2
                }}
              >
                {state.actionLoading.refresh ? (
                  <CircularProgress size={24} />
                ) : (
                  <Refresh />
                )}
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: `linear-gradient(33deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 4px 10px ${colors.primary}30`,
                borderRadius: 5,
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
        {state.initialLoad ? (
          <StatsSkeleton />
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 2,
            mb: 3
          }}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Total Products</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{state.stats.totalProducts}</Typography>
                <Category color="primary" />
              </Box>
          
            </Paper>

            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Total Stock</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{state.stats.totalStock}</Typography>
                <Inventory color="secondary" />
              </Box>
              <Typography variant="caption" color="textSecondary">Items in inventory</Typography>
            </Paper>

            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Inventory Value</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>${state.stats.totalValue.toFixed(2)}</Typography>
                <AttachMoney color="success" />
              </Box>
              <Typography variant="caption" color="textSecondary">Current stock value</Typography>
            </Paper>

            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Categories</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{state.stats.totalCategories}</Typography>
                <FilterList color="warning" />
              </Box>
              <Typography variant="caption" color="textSecondary">Active categories</Typography>
            </Paper>
          </Box>
        )}
      </motion.div>

      {/* Search and Filters */}
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
              value={state.searchTerm}
              onChange={(e) => {
                setState(prev => ({ ...prev, searchTerm: e.target.value, page: 0 }));
              }}
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
                variant={state.selectedCategory === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setState(prev => ({ ...prev, selectedCategory: 'all', page: 0 }))}
                sx={{ borderRadius: 2 }}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={state.selectedCategory === category.value ? 'contained' : 'outlined'}
                  size="small"
                  color={category.color}
                  onClick={() => setState(prev => ({ ...prev, selectedCategory: category.value, page: 0 }))}
                  sx={{ borderRadius: 2 }}
                >
                  {category.icon} {category.value}
                </Button>
              ))}
            </Box>
          </Box>

         
        </Paper>
      </motion.div>

      {/* Product Table */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {state.initialLoad ? (
            <TableSkeleton />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: colors.light }}>
                    <TableRow>
                      {[
                        { field: 'name', label: 'Name' },
                        { field: 'description', label: 'Description' },
                        { field: 'price', label: 'Price' },
                        { field: 'stockQuantity', label: 'Stock' },
                        { field: 'category', label: 'Category' },
                        { field: '', label: 'Actions' }
                      ].map((header) => (
                        <TableCell
                          key={header.field || 'actions'}
                          sx={{ 
                            fontWeight: 700,
                            cursor: header.field ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (header.field) {
                              setState(prev => ({
                                ...prev,
                                sortConfig: {
                                  field: header.field,
                                  direction: prev.sortConfig.field === header.field && 
                                    prev.sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                },
                                page: 0
                              }));
                            }
                          }}
                        >
                          {header.label}
                          {header.field && <SortIndicator field={header.field} />}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {state.loading && state.products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : state.products.length > 0 ? (
                      state.products.map((product) => (
                        <TableRow
                          hover
                          key={product.id}
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                            '&:hover': { bgcolor: `${colors.primary}08` },
                            opacity: product.isDeleted ? 0.7 : 1,
                            bgcolor: product.isDeleted ? `${colors.error}10` : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={500}>{product.name}</Typography>
                            {product.isDeleted && (
                              <Typography variant="caption" color="textSecondary">
                                (Deleted)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {product.description?.substring(0, 50)}...
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
                              {!product.isDeleted && (
                                <>
                                  <Tooltip title="Edit" arrow>
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleOpenDialog(product)}
                                      size="small"
                                      disabled={state.actionLoading.edit === product.id}
                                    >
                                      {state.actionLoading.edit === product.id ? (
                                        <CircularProgress size={24} />
                                      ) : (
                                        <Edit fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                  
                                </>
                              )}
                              {product.isDeleted ? (
                                <Tooltip title="Restore" arrow>
                                  <IconButton
                                    color="success"
                                    onClick={() => handleRestore(product.id)}
                                    size="small"
                                    disabled={state.actionLoading.restore === product.id}
                                  >
                                    {state.actionLoading.restore === product.id ? (
                                      <CircularProgress size={24} />
                                    ) : (
                                      <RestoreFromTrash fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Delete" arrow>
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDelete(product.id)}
                                    size="small"
                                    disabled={state.actionLoading.delete === product.id}
                                  >
                                    {state.actionLoading.delete === product.id ? (
                                      <CircularProgress size={24} />
                                    ) : (
                                      <Delete fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                                setState(prev => ({
                                  ...prev,
                                  searchTerm: '',
                                  selectedCategory: 'all',
                                  filters: {
                                    isActive: null,
                                    includeDeleted: false
                                  }
                                }));
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Rows per page:
                  </Typography>
                  <Select
                    value={state.rowsPerPage}
                    onChange={(e) => {
                      setState(prev => ({
                        ...prev,
                        rowsPerPage: parseInt(e.target.value, 10),
                        page: 0
                      }));
                    }}
                    size="small"
                    sx={{
                      borderRadius: 5,
                      '& .MuiSelect-select': { py: 0.5 }
                    }}
                  >
                    {[5, 10, 25, 50, 100].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box sx={{ display: 'flex', borderRadius: 14, gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setState(prev => ({ ...prev, page: 0 }))}
                    disabled={state.page === 0}
                    startIcon={<FirstPage />}
                    sx={{ minWidth: 32, borderRadius: 5 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setState(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                    disabled={state.page === 0}
                    startIcon={<ChevronLeft />}
                    sx={{ minWidth: 32, borderRadius: 5 }}
                  />

                  {getPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={state.page === pageNumber ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setState(prev => ({ ...prev, page: pageNumber }))}
                      sx={{
                        minWidth: 32, borderRadius: 5,
                        fontWeight: state.page === pageNumber ? 600 : 400
                      }}
                    >
                      {pageNumber + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setState(prev => ({ ...prev, page: Math.min(totalPages - 1, prev.page + 1) }))}
                    disabled={state.page >= totalPages - 1}
                    startIcon={<ChevronRight />}
                    sx={{ minWidth: 32, borderRadius: 5 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setState(prev => ({ ...prev, page: totalPages - 1 }))}
                    disabled={state.page >= totalPages - 1}
                    startIcon={<LastPage />}
                    sx={{ minWidth: 32, borderRadius: 5 }}
                  />
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </motion.div>

      {/* Product Dialog */}
      <Dialog
        open={state.openDialog}
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
            {state.currentProduct ? 'Edit Product' : 'Create New Product'}
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
                    startAdornment: <AttachMoney fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                    inputProps: { min: 0.01, step: 0.01 }
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
                    startAdornment: <Inventory fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                    inputProps: { min: 0 }
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
                        {category.icon} {category.value}
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

              {state.currentProduct && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                 
                  {formik.values.isDeleted && (
                    <Chip
                      label="Deleted"
                      color="error"
                      icon={<Delete fontSize="small" />}
                    />
                  )}
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
              disabled={state.loading || !formik.isValid}
              startIcon={state.loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 2px 6px ${colors.primary}30`,
                borderRadius: 5,
                '&:hover': {
                  boxShadow: `0 4px 10px ${colors.primary}50`
                }
              }}
            >
              {state.loading ? 'Processing...' : 'Save Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={state.notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={state.notification.severity}
          sx={{ width: '100%' }}
        >
          {state.notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductTable;