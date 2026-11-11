import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Bookings from './pages/Bookings.jsx'
import BookingForm from './pages/BookingForm.jsx'
import { useAuth } from './hooks/useAuth.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  const { user, logout } = useAuth()
  return (
    <div className="container">
      <nav className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold">Dorm Room Booking</Link>
          <Link to="/bookings" className="text-sm">Bookings</Link>
          {user && <Link to="/bookings/new" className="text-sm">Book a Room</Link>}
        </div>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login" className="btn">Login</Link>
              <Link to="/register" className="btn">Register</Link>
            </>
          ) : (
            <>
              <span className="text-sm">Logged in as <b>{user.name}</b></span>
              <button onClick={logout} className="btn">Logout</button>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/bookings" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/new" element={
          <ProtectedRoute><BookingForm /></ProtectedRoute>
        } />
        <Route path="/bookings/:id" element={
          <ProtectedRoute><BookingForm /></ProtectedRoute>
        } />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </div>
  )
}
