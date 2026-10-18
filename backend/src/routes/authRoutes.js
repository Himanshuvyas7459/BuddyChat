import express from 'express'
import {
  signup,
  login
} from '../controllers/authController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)

router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      bio: req.user.bio,
      isOnline: req.user.isOnline,
      lastSeen: req.user.lastSeen
    }
  })
})

export default router