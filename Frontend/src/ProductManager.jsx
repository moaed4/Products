import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, Pagination, Stack
} from "@mui/material";
import axios from "axios";

const API_URL = "https://localhost:7005/api/Products";

const defaultForm = {
  id: 0,
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  category: ""
};

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const fetchProducts = async (pageNumber = 1) => {
    try {
      const res = await axios.get(`${API_URL}?page=${pageNumber}&pageSize=${pageSize}`);
      setProducts(res.data.data);
      setTotalItems(res.data.totalItems);
      setPage(res.data.page);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpen = (product = defaultForm) => {
    setForm(product);
    setIsEdit(!!product.id);
    setOpen(true);
  };

  const handleClose = () => {
    setForm(defaultForm);
    setOpen(false);
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${form.id}`, form);
      } else {
        await axios.post(API_URL, form);
      }
      handleClose();
      fetchProducts(page);
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchProducts(page);
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <h2>Product Manager</h2>
        <Button variant="contained" onClick={() => handleOpen()}>Add Product</Button>
      </Stack>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell>${p.price}</TableCell>
                <TableCell>{p.stockQuantity}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(p)} size="small">Edit</Button>
                  <Button onClick={() => handleDelete(p.id)} size="small" color="error">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack alignItems="center" mt={2}>
        <Pagination
          count={Math.ceil(totalItems / pageSize)}
          page={page}
          onChange={(e, value) => fetchProducts(value)}
          color="primary"
        />
      </Stack>

      {/* Dialog for Add/Edit */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEdit ? "Edit" : "Add"} Product</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Name" name="name" fullWidth value={form.name} onChange={handleChange} />
          <TextField margin="dense" label="Description" name="description" fullWidth value={form.description} onChange={handleChange} />
          <TextField margin="dense" label="Price" name="price" type="number" fullWidth value={form.price} onChange={handleChange} />
          <TextField margin="dense" label="Stock Quantity" name="stockQuantity" type="number" fullWidth value={form.stockQuantity} onChange={handleChange} />
          <TextField margin="dense" label="Category" name="category" fullWidth value={form.category} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEdit ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProductManager;
