import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import CreateEvent from './pages/CreateEvent'
import VotePage from './pages/VotePage'
import EventResults from './pages/EventResults'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/vote/:token" element={<VotePage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id/results"
        element={
          <ProtectedRoute>
            <EventResults />
          </ProtectedRoute>
        }
      />

      {/* Default: redirect root to dashboard (will bounce to login if not authed) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
