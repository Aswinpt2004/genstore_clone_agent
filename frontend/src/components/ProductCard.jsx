import { useState } from 'react'
import { deleteProduct, improveDescription, updateProduct } from '../api'
import { formatRupees, pollinationsImageUrl, productImageUrl } from '../utils/format'

export default function ProductCard({
  product,
  storeId,
  themeColor,
  editable = false,
  onUpdate,
  onDelete,
  storeName = '',
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price || '',
    category: product.category || '',
    stock: product.stock ?? 100,
    image_url: product.image_url || '',
    brand: product.brand || '',
  })

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const syncForm = () => {
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      stock: product.stock ?? 100,
      image_url: product.image_url || '',
      brand: product.brand || '',
    })
  }

  const handleImageGenerate = () => {
    updateField(
      'image_url',
      pollinationsImageUrl(
        `${form.name || product.name} ${form.category || product.category}, premium ecommerce product photo for ${storeName || 'online store'}`,
        product.id
      )
    )
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const updated = await updateProduct(storeId, product.id, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      })
      onUpdate?.(updated)
      setEditing(false)
    } catch {
      alert('Failed to update product.')
    } finally {
      setSaving(false)
    }
  }

  const handleImprove = async () => {
    const updated = await improveDescription(storeId, product.id)
    onUpdate?.(updated)
    setForm((current) => ({ ...current, description: updated.description || current.description }))
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}"?`)) return

    await deleteProduct(storeId, product.id)
    onDelete?.(product.id)
  }

  const stockStatus =
    product.stock <= 0 ? 'Out of stock' : product.stock < 10 ? 'Low stock' : 'In stock'
  const stockClass =
    product.stock <= 0 ? 'stock-out' : product.stock < 10 ? 'stock-low' : 'stock-ok'

  if (editable && editing) {
    return (
      <article className="card product-card editing-card">
        <img
          className="product-image"
          src={form.image_url || productImageUrl(product, storeName)}
          alt={form.name || product.name}
        />

        <form className="form product-edit-form" onSubmit={handleSave}>
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

          <div className="form-grid">
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
          </div>

          <div className="form-grid">
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
              Brand
              <input
                className="field"
                value={form.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          <label className="label">
            Image URL
            <div className="input-action">
              <input
                className="field"
                value={form.image_url}
                onChange={(e) => updateField('image_url', e.target.value)}
                placeholder="Paste an image URL or generate one"
              />
              <button className="button secondary small" type="button" onClick={handleImageGenerate}>
                Generate
              </button>
            </div>
          </label>

          <div className="row product-actions">
            <button className="button small" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="button secondary small"
              type="button"
              onClick={() => {
                syncForm()
                setEditing(false)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className="card product-card">
      <img className="product-image" src={productImageUrl(product, storeName)} alt={product.name} />
      {product.brand && <span className="brand-tag">{product.brand}</span>}
      <h3>{product.name}</h3>
      {(product.rating || product.review_count) && (
        <div className="product-rating">
          <span className="stars">★ {product.rating?.toFixed(1) ?? '—'}</span>
          {product.review_count != null && (
            <span className="muted">({product.review_count} reviews)</span>
          )}
        </div>
      )}
      <p className="muted">{product.description}</p>
      <p className="price" style={{ color: themeColor || '#2563eb' }}>
        {formatRupees(product.price)}
      </p>
      <div className="row space-between">
        <span className="tag">{product.category}</span>
        <span className={`stock-badge ${stockClass}`}>{stockStatus} ({product.stock})</span>
      </div>

      {editable ? (
        <div className="row product-actions">
          <button className="button small" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="button secondary small" onClick={handleImprove}>
            Improve
          </button>
          <button className="button danger small" onClick={handleDelete}>
            Delete
          </button>
        </div>
      ) : (
        <button className="button small" style={{ backgroundColor: themeColor || '#2563eb' }}>
          Add to Cart
        </button>
      )}
    </article>
  )
}
