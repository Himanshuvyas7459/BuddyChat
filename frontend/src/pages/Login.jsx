import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginUser } from '../store/authSlice'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error('Please fill all fields')
      return
    }

    const result = await dispatch(loginUser(formData))

    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } else {
      toast.error(result.payload || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Buddy<span className="text-red-500">Chat</span>
          </h1>

          <p className="text-slate-400 mt-2">
            Chat. Connect. Chill.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          <h2 className="text-2xl font-semibold text-white">
            Welcome back
          </h2>

          <p className="text-slate-400 mt-1 mb-6">
            Login to continue to BuddyChat
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm text-slate-300">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          <p className="text-center text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login