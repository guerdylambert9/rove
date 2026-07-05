import { Routes, Route } from 'react-router-dom'
import Browse from './pages/Browse.jsx'
import CarDetail from './pages/CarDetail.jsx'
import Insurance from './pages/Insurance.jsx'
import Checkout from './pages/Checkout.jsx'
import Confirmed from './pages/Confirmed.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  return (
    <div className="shell">
      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/car/:id" element={<CarDetail />} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmed" element={<Confirmed />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}
