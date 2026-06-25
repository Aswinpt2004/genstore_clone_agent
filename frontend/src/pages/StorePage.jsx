import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStore } from '../api'
import ChatWidget from '../components/ChatWidget'
import ProductCard from '../components/ProductCard'
import { storeImageUrl } from '../utils/format'

export default function StorePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getStore(id)
      .then(setStore)
      .catch(() => setError('Store not found.'))
  }, [id])

  if (error) return <main className="container error">{error}</main>
  if (!store) return <main className="container muted">Loading store...</main>

  return (
    <>
      <header className="store-hero">
        <img className="store-hero-bg" src={storeImageUrl(store)} alt="" />
        <div className="store-hero-content">
          <span className="color-dot" style={{ backgroundColor: store.theme_color || '#2563eb' }}>
            {store.name?.charAt(0) || 'S'}
          </span>
          <h1>{store.name}</h1>
          <p>{store.tagline}</p>
          <span className="tag">{store.category}</span>
        </div>
      </header>

      <main className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Storefront</p>
            <h2>Products</h2>
          </div>
          <button className="button secondary" onClick={() => navigate(`/dashboard/${store.id}`)}>
            Manage Store
          </button>
        </div>

        {store.products.length === 0 ? (
          <p className="muted">No products yet.</p>
        ) : (
          <section className="grid">
            {store.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeId={store.id}
                themeColor={store.theme_color}
                storeName={store.name}
              />
            ))}
          </section>
        )}
      </main>

      <ChatWidget storeId={store.id} storeName={store.name} />
    </>
  )
}
