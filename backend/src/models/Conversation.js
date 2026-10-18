import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],

  isGroup: {
    type: Boolean,
    default: false
  },

  groupName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },

  groupAvatar: {
    type: String,
    default: ''
  },

  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
})

const Conversation = mongoose.model(
  'Conversation',
  conversationSchema
)

export default Conversation