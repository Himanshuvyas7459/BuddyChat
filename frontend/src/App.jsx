import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { getCurrentUser } from './store/authSlice'

const App = () => {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem('buddychat_token')

    if (token && !user) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, user])

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin mx-auto" />

          <p className="text-slate-400 mt-4">
            Loading BuddyChat...
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      <Route
        path="/signup"
        element={
          user
            ? <Navigate to="/dashboard" replace />
            : <Signup />
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={user ? '/dashboard' : '/login'}
            replace
          />
        }
      />
    </Routes>
  )
}

export default App