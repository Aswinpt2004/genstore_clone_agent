import { useState } from 'react'
import { sendChat } from '../api'

export default function ChatWidget({ storeId, storeName }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi! I can help improve ${storeName || 'your store'}.`,
    },
  ])

  const handleSend = async () => {
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', text: message }])

    try {
      const data = await sendChat(storeId, message)
      setMessages((current) => [...current, { role: 'ai', text: data.reply }])
    } catch {
      setMessages((current) => [...current, { role: 'ai', text: 'Chat failed. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <div className="chat">
        <button className="button" onClick={() => setOpen(true)}>
          Open Chat
        </button>
      </div>
    )
  }

  return (
    <section className="chat card">
      <div className="row space-between">
        <strong>Store Chat</strong>
        <button className="button secondary small" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            {message.text}
          </div>
        ))}
        {loading && <div className="message">Thinking...</div>}
      </div>

      <div className="row">
        <input
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          placeholder="Ask about this store"
        />
        <button className="button small" onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </section>
  )
}
