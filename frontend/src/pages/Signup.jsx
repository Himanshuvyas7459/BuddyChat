import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signupUser } from '../store/authSlice'

const Signup = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const {
      username,
      email,
      password,
      confirmPassword
    } = formData

    if (!username || !email || !password || !confirmPassword) {
      toast.error('Please fill all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const result = await dispatch(
      signupUser({
        username,
        email,
        password
      })
    )

    if (signupUser.fulfilled.match(result)) {
      toast.success('Account created successfully')
      navigate('/dashboard', { replace: true })
    } else {
      toast.error(result.payload || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Buddy<span className="text-red-500">Chat</span>
          </h1>

          <p className="text-slate-400 mt-2">
            Your conversations start here.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          <h2 className="text-2xl font-semibold text-white">
            Create account
          </h2>

          <p className="text-slate-400 mt-1 mb-6">
            Join BuddyChat today
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm text-slate-300">
                Username
              </label>

              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="your username"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
              />
            </div>

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
                placeholder="Minimum 8 characters"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Signup