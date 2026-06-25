import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import StorePage from './pages/StorePage'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

