import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        GenAI Store
      </Link>
      <Link to="/">All Stores</Link>
    </nav>
  )
}

