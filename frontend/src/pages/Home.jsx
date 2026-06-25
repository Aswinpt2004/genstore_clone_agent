import { useEffect, useState } from 'react'
import { listStores } from '../api'
import AgentBuilder from '../components/AgentBuilder'
import PromptBox from '../components/PromptBox'
import StoreCard from '../components/StoreCard'
import { pollinationsImageUrl } from '../utils/format'

export default function Home() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listStores()
      .then(setStores)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = (id) => {
    setStores((current) => current.filter((store) => store.id !== id))
  }

  const handleStoreCreated = (store) => {
    setStores((current) => [store, ...current.filter((item) => item.id !== store.id)])
  }

  return (
    <main className="container">
      <section className="hero">
        <img
          className="hero-bg"
          src={pollinationsImageUrl('A futuristic attractive ecommerce store builder workspace with colorful product shelves', 'genstore-home')}
          alt=""
        />
        <div className="hero-content">
          <span className="eyebrow">AI store builder</span>
          <h1>Your store, instantly.</h1>
          <p>Enter an idea and generate a polished online store with products, images, and rupee pricing.</p>
        </div>
      </section>

      <PromptBox />
      <AgentBuilder onStoreCreated={handleStoreCreated} />

      <div className="section-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Your Stores</h2>
        </div>
        <span className="muted">{stores.length} stores</span>
      </div>

      {loading ? (
        <p className="muted">Loading stores...</p>
      ) : stores.length === 0 ? (
        <p className="muted">No stores yet.</p>
      ) : (
        <section className="grid">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} onDelete={handleDelete} />
          ))}
        </section>
      )}
    </main>
  )
}
