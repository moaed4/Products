import axios from 'axios';

const API_URL = '/api/products';

const getProducts = async (queryParams) => {
  const response = await axios.get(API_URL, { params: queryParams });
  return response.data;
};

const getProductById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

const createProduct = async (productData) => {
  const response = await axios.post(API_URL, productData);
  return response.data;
};

const updateProduct = async (id, productData) => {
  const response = await axios.put(`${API_URL}/${id}`, productData);
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};