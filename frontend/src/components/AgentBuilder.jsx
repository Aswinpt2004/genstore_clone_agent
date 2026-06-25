import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runAgent } from '../api'
import LoadingSpinner from './LoadingSpinner'

const AGENT_EXAMPLES = [
  'Build a luxury watch store for young professionals and prepare a launch plan',
  'Create a sustainable stationery store with a rich catalog and sharper product copy',
  'Launch a premium sneaker store for college students with marketing advice',
]

export default function AgentBuilder({ onStoreCreated }) {
  const [goal, setGoal] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRun = async () => {
    if (!goal.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const agentResult = await runAgent(goal.trim())
      setResult(agentResult)
      if (agentResult.store) onStoreCreated?.(agentResult.store)
    } catch (err) {
      const detail = err.response?.data?.detail || err.message
      setError(`Agent failed: ${detail}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="agent-panel">
      <div>
        <p className="eyebrow">Agent mode</p>
        <h2>Give the AI a business goal.</h2>
        <p className="muted">
          The agent plans the workflow, calls store-building tools, improves the catalog, and prepares launch guidance.
        </p>
      </div>

      <div className="agent-workspace card">
        <textarea
          className="textarea"
          placeholder="Example: Build a premium sneaker store for college students, add products, improve descriptions, and suggest a launch plan"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />

        <div className="row space-between wrap">
          <span className="muted">This runs a multi-step tool-using agent.</span>
          <button className="button" onClick={handleRun} disabled={!goal.trim() || loading}>
            Run Agent
          </button>
        </div>

        <div className="row wrap">
          {AGENT_EXAMPLES.map((example) => (
            <button
              className="button secondary small"
              key={example}
              onClick={() => setGoal(example)}
            >
              {example}
            </button>
          ))}
        </div>

        {loading && <LoadingSpinner message="Agent is planning and calling tools..." />}
        {error && <p className="error">{error}</p>}

        {result && (
          <div className="agent-result">
            <div className="row space-between wrap">
              <div>
                <h3>{result.store?.name || 'Agent result'}</h3>
                <p className="muted">{result.summary}</p>
              </div>
              {result.store && (
                <button className="button secondary" onClick={() => navigate(`/store/${result.store.id}`)}>
                  Open Store
                </button>
              )}
            </div>

            <div className="agent-steps">
              {result.steps?.map((step, index) => (
                <article className="agent-step" key={`${step.tool}-${index}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{step.tool.replaceAll('_', ' ')}</strong>
                    <p>{step.observation}</p>
                  </div>
                </article>
              ))}
            </div>

            {result.launch_advice && (
              <div className="launch-advice">
                <strong>Launch advice</strong>
                <p>{result.launch_advice}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
