import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },

  avatar: {
    type: String,
    default: ''
  },

  bio: {
    type: String,
    maxlength: 150,
    default: ''
  },

  isOnline: {
    type: Boolean,
    default: false
  },

  lastSeen: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

const User = mongoose.model('User', userSchema)

export default User