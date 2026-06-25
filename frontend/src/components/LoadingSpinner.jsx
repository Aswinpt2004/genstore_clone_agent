export default function LoadingSpinner({ message = "Generating..." }) {
  return (
    <div className="container">
      <p className="muted">{message}</p>
    </div>
  )
}

