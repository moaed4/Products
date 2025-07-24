import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'
import { Close, Save } from '@mui/icons-material'

export default function ItemFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues = {},
  categories = ['Electronics', 'Clothing', 'Food']
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    ...initialValues
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        ...initialValues
      })
      setErrors({})
    }
  }, [open, initialValues])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Required'
    if (formData.price <= 0) newErrors.price = 'Must be positive'
    if (formData.stock < 0) newErrors.stock = 'Cannot be negative'
    if (!formData.category) newErrors.category = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialValues.id ? 'Edit Product' : 'Add Product'}
      </DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              error={!!errors.stock}
              helperText={errors.stock}
              inputProps={{ min: 0 }}
            />
          </Box>
          <FormControl fullWidth margin="normal" error={!!errors.category}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              label="Category"
              onChange={handleChange}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
            {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<Close />}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          startIcon={<Save />}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}