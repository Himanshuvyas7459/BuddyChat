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


export const updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar } = req.body
    const userId = req.user._id

    const updates = {}

    if (username !== undefined) {
      const trimmedUsername = username.trim()

      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        return res.status(400).json({
          message: 'Username must be between 3 and 30 characters'
        })
      }

      const existingUser = await User.findOne({
        username: trimmedUsername,
        _id: { $ne: userId }
      })

      if (existingUser) {
        return res.status(409).json({
          message: 'Username already exists'
        })
      }

      updates.username = trimmedUsername
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 150) {
        return res.status(400).json({
          message: 'Bio must be 150 characters or less'
        })
      }

      updates.bio = bio.trim()
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({
          message: 'Invalid avatar'
        })
      }

      updates.avatar = avatar.trim()
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No profile changes provided'
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    const io = req.app.get('io')

    io.emit('profile-updated', {
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      bio: user.bio
    })

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)

    res.status(500).json({
      message: 'Server error'
    })
  }
}
