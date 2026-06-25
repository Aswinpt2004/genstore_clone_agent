import axios from 'axios'

const BASE = '/api'

export const generateStore = (prompt) =>
  axios.post(`${BASE}/generate`, { prompt }).then(r => r.data)

export const listStores = () =>
  axios.get(`${BASE}/stores`).then(r => r.data)

export const getStore = (id) =>
  axios.get(`${BASE}/stores/${id}`).then(r => r.data)

export const updateStore = (id, data) =>
  axios.put(`${BASE}/stores/${id}`, data).then(r => r.data)

export const deleteStore = (id) =>
  axios.delete(`${BASE}/stores/${id}`).then(r => r.data)

export const addProduct = (storeId, data) =>
  axios.post(`${BASE}/stores/${storeId}/products`, data).then(r => r.data)

export const generateMoreProducts = (storeId) =>
  axios.post(`${BASE}/stores/${storeId}/products/generate`).then(r => r.data)

export const updateProduct = (storeId, productId, data) =>
  axios.put(`${BASE}/stores/${storeId}/products/${productId}`, data).then(r => r.data)

export const deleteProduct = (storeId, productId) =>
  axios.delete(`${BASE}/stores/${storeId}/products/${productId}`).then(r => r.data)

export const improveDescription = (storeId, productId) =>
  axios.post(`${BASE}/stores/${storeId}/products/${productId}/improve`).then(r => r.data)

export const sendChat = (storeId, message) =>
  axios.post(`${BASE}/chat`, { store_id: storeId, message }).then(r => r.data)

