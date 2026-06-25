import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generateMoreProducts, getStore, updateStore } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductCard from '../components/ProductCard'
import ProductForm from '../components/ProductForm'
import { formatRupees, storeImageUrl } from '../utils/format'

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    tagline: '',
    category: '',
    theme_color: '#2563eb',
  })
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getStore(id).then((data) => {
      setStore(data)
      setEditForm({
        name: data.name,
        tagline: data.tagline,
        category: data.category,
        theme_color: data.theme_color || '#2563eb',
      })
    })
  }, [id])

  const updateField = (key, value) => {
    setEditForm((current) => ({ ...current, [key]: value }))
  }

  const saveStore = async () => {
    const updated = await updateStore(id, editForm)
    setStore(updated)
  }

  const generateProducts = async () => {
    setGenerating(true)
    try {
      const updated = await generateMoreProducts(id)
      setStore(updated)
    } finally {
      setGenerating(false)
    }
  }

  const handleProductUpdate = (updatedProduct) => {
    setStore((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      ),
    }))
  }

  const handleProductDelete = (productId) => {
    setStore((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== productId),
    }))
  }

  if (!store) return <LoadingSpinner message="Loading dashboard..." />

  const averagePrice =
    store.products.length === 0
      ? 0
      : store.products.reduce((total, product) => total + Number(product.price || 0), 0) /
        store.products.length

  return (
    <main className="container dashboard-page">
      <section className="dashboard-hero">
        <div>
          <button className="button secondary small" onClick={() => navigate(`/store/${store.id}`)}>
            View Storefront
          </button>
          <h1>Manage {store.name}</h1>
          <p className="muted">Edit your storefront, product catalog, images, pricing, and stock.</p>
        </div>
        <img className="dashboard-hero-image" src={storeImageUrl(store)} alt={store.name} />
      </section>

      <section className="manager-layout">
        <aside className="card edit-panel">
          <div>
            <p className="eyebrow">Store settings</p>
            <h2>Everything here is editable</h2>
          </div>

          <div className="form">
            <label className="label">
              Store name
              <input
                className="field"
                value={editForm.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </label>
            <label className="label">
              Tagline
              <input
                className="field"
                value={editForm.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
              />
            </label>
            <label className="label">
              Category
              <input
                className="field"
                value={editForm.category}
                onChange={(e) => updateField('category', e.target.value)}
              />
            </label>
            <label className="label">
              Theme color
              <input
                className="field"
                type="color"
                value={editForm.theme_color}
                onChange={(e) => updateField('theme_color', e.target.value)}
              />
            </label>
            <button className="button" onClick={saveStore}>
              Save Store
            </button>
          </div>
        </aside>

        <section className="stats-grid">
          <article className="metric-card">
            <strong>{store.products.length}</strong>
            <span className="muted">Products</span>
          </article>
          <article className="metric-card">
            <strong>{formatRupees(averagePrice)}</strong>
            <span className="muted">Average price</span>
          </article>
          <article className="metric-card">
            <strong>{store.category}</strong>
            <span className="muted">Category</span>
          </article>
        </section>
      </section>

      <div className="section-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Products</h2>
        </div>
        <div className="row">
          <button className="button secondary" onClick={generateProducts} disabled={generating}>
            {generating ? 'Generating...' : 'Generate More'}
          </button>
          <button className="button" onClick={() => setShowAddProduct(true)}>
            Add Product
          </button>
        </div>
      </div>

      {store.products.length === 0 ? (
        <p className="muted">No products yet.</p>
      ) : (
        <section className="grid">
          {store.products.map((product) => (
            <ProductCard
              editable
              key={product.id}
              product={product}
              storeId={store.id}
              storeName={store.name}
              themeColor={store.theme_color}
              onUpdate={handleProductUpdate}
              onDelete={handleProductDelete}
            />
          ))}
        </section>
      )}

      {showAddProduct && (
        <ProductForm
          storeId={store.id}
          storeName={store.name}
          onAdded={setStore}
          onClose={() => setShowAddProduct(false)}
        />
      )}
    </main>
  )
}
