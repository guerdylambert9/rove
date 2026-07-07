import { Routes, Route } from 'react-router-dom'
import Browse from './pages/Browse.jsx'
import CarDetail from './pages/CarDetail.jsx'
import Insurance from './pages/Insurance.jsx'
import Checkout from './pages/Checkout.jsx'
import Confirmed from './pages/Confirmed.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Account from './pages/Account.jsx'
import Trips from './pages/Trips.jsx'
import Inbox from './pages/Inbox.jsx'
import Fleet from './pages/Fleet.jsx'
import AddVehicle from './pages/AddVehicle.jsx'
import OwnerRoute from './components/OwnerRoute.jsx'

export default function App() {
  return (
    <div className="shell">
      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/car/:id" element={<CarDetail />} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmed" element={<Confirmed />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route
          path="/dashboard"
          element={
            <OwnerRoute>
              <Dashboard />
            </OwnerRoute>
          }
        />
        <Route
          path="/fleet"
          element={
            <OwnerRoute>
              <Fleet />
            </OwnerRoute>
          }
        />
        <Route
          path="/fleet/add"
          element={
            <OwnerRoute>
              <AddVehicle />
            </OwnerRoute>
          }
        />
        <Route path="/account" element={<Account />} />
      </Routes>
    </div>
  )
}
