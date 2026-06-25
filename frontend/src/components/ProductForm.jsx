import { useState } from 'react'
import { addProduct } from '../api'
import { pollinationsImageUrl } from '../utils/format'

export default function ProductForm({ storeId, storeName, onAdded, onClose }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 100,
    image_url: '',
  })
  const [loading, setLoading] = useState(false)

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const updated = await addProduct(storeId, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url:
          form.image_url ||
          pollinationsImageUrl(
            `${form.name} ${form.category}, premium ecommerce product photo for ${storeName || 'online store'}`,
            `${storeId}-${form.name}`
          ),
      })
      onAdded(updated)
      onClose()
    } catch {
      alert('Failed to add product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="card modal">
        <div className="row space-between">
          <h2>Add Product</h2>
          <button className="button secondary small" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Product name
            <input
              className="field"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </label>

          <label className="label">
            Description
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              required
            />
          </label>

          <label className="label">
            Price in rupees
            <input
              className="field"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              required
            />
          </label>

          <label className="label">
            Category
            <input
              className="field"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              required
            />
          </label>

          <label className="label">
            Stock
            <input
              className="field"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value)}
              required
            />
          </label>

          <label className="label">
            Image URL
            <div className="input-action">
              <input
                className="field"
                value={form.image_url}
                onChange={(e) => updateField('image_url', e.target.value)}
                placeholder="Paste an image URL or generate one"
              />
              <button
                className="button secondary small"
                type="button"
                onClick={() =>
                  updateField(
                    'image_url',
                    pollinationsImageUrl(
                      `${form.name || 'New product'} ${form.category}, premium ecommerce product photo for ${storeName || 'online store'}`,
                      `${storeId}-${form.name || 'new-product'}`
                    )
                  )
                }
              >
                Generate
              </button>
            </div>
          </label>

          <button className="button" disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </section>
    </div>
  )
}
