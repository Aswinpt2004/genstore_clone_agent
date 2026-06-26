import axios from 'axios'

const BASE = '/api'

export const runAgent = (goal) =>
  axios.post(`${BASE}/agent/run`, { goal }).then(r => r.data)

// Streams live agent progress via SSE. Calls onEvent for each event and
// resolves with the final result once a "done" event arrives.
export const runAgentStream = async (goal, onEvent) => {
  const response = await fetch(`${BASE}/agent/run/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal }),
  })
  if (!response.ok || !response.body) {
    throw new Error(`Agent stream failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop()
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data: '))
      if (!line) continue
      const event = JSON.parse(line.slice(6))
      if (event.type === 'error') throw new Error(event.message)
      if (event.type === 'done') result = event.result
      onEvent?.(event)
    }
  }

  return result
}

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

