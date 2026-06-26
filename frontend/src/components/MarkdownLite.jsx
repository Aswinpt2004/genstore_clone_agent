function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  )
}

// Renders simple AI-generated markdown (bold text + bullet lists) as real
// HTML instead of showing literal "**" and "*" characters.
export default function MarkdownLite({ text }) {
  if (!text) return null

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const blocks = []
  let currentList = null

  for (const line of lines) {
    const bulletMatch = line.match(/^[*-]\s+(.*)/)
    if (bulletMatch) {
      if (!currentList) {
        currentList = []
        blocks.push({ type: 'list', items: currentList })
      }
      currentList.push(bulletMatch[1])
    } else {
      currentList = null
      blocks.push({ type: 'p', text: line })
    }
  }

  return (
    <div className="markdown-lite">
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <ul key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item)}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>{renderInline(block.text)}</p>
        )
      )}
    </div>
  )
}
