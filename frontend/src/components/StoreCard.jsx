import { useNavigate } from 'react-router-dom'
import { deleteStore } from '../api'
import { storeImageUrl } from '../utils/format'

export default function StoreCard({ store, onDelete }) {
  const navigate = useNavigate()

  const handleDelete = async (event) => {
    event.stopPropagation()
    if (!confirm(`Delete "${store.name}"?`)) return

    await deleteStore(store.id)
    onDelete(store.id)
  }

  return (
    <article className="card store-card" onClick={() => navigate(`/store/${store.id}`)}>
      <img className="store-card-image" src={storeImageUrl(store)} alt={store.name} />
      <div className="row">
        <span className="color-dot" style={{ backgroundColor: store.theme_color || '#2563eb' }}>
          {store.name?.charAt(0) || 'S'}
        </span>
        <div>
          <h3>{store.name}</h3>
          <p className="muted">{store.tagline}</p>
        </div>
      </div>

      <p>
        <span className="tag">{store.category}</span>
      </p>

      <div className="row space-between">
        <span className="muted">{store.products?.length || 0} products</span>
        <div className="row">
          <button
            className="button secondary small"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/dashboard/${store.id}`)
            }}
          >
            Manage
          </button>
          <button className="button danger small" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}
