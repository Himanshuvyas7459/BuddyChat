import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      })
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'Username or email already exists'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      username,
      email,
      password: hashedPassword
    })

    const token = generateToken(user._id)

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    })
  } catch (error) {
    console.error('Signup error:', error)

    res.status(500).json({
      message: 'Server error'
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      })
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    })
  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      message: 'Server error'
    })
  }
}