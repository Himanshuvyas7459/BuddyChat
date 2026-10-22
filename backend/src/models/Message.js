import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  text: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: ''
  },

  messageType: {
  type: String,
  enum: ['text', 'image', 'file', 'document'],
  default: 'text'
},

  fileUrl: {
    type: String,
    default: ''
  },

  isDelivered: {
  type: Boolean,
  default: false
},

isSeen: {
  type: Boolean,
  default: false
},

isDeleted: {
  type: Boolean,
  default: false
},

replyTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Message',
  default: null
},
}, {
  timestamps: true
})

const Message = mongoose.model(
  'Message',
  messageSchema
)

export default Message