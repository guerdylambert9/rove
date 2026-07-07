import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { BookingProvider } from './state/booking.jsx'
import { AuthProvider } from './state/auth.jsx'
import AuthGate from './components/AuthGate.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <BookingProvider>
            <App />
          </BookingProvider>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
