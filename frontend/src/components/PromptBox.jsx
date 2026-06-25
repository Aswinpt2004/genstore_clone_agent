import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateStore } from '../api'
import LoadingSpinner from './LoadingSpinner'

const EXAMPLES = [
  'A vintage clothing store for Gen Z',
  'Handmade candles and home fragrance',
  'Premium pet food for dogs',
  'Minimalist tech accessories',
  'Organic skincare for sensitive skin',
]

export default function PromptBox() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')

    try {
      const store = await generateStore(prompt.trim())
      navigate(`/store/${store.id}`)
    } catch (err) {
      const detail = err.response?.data?.detail || err.message
      setError(`Generation failed: ${detail}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message="AI is building your store..." />

  return (
    <section className="prompt-box card">
      <textarea
        placeholder="Example: A premium pet food store for health-conscious dog owners"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="row space-between wrap">
        <span className="muted">Describe the store you want to create.</span>
        <button className="button" onClick={handleGenerate} disabled={!prompt.trim()}>
          Generate Store
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="row wrap">
        {EXAMPLES.map((example) => (
          <button
            className="button secondary small"
            key={example}
            onClick={() => setPrompt(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  )
}
