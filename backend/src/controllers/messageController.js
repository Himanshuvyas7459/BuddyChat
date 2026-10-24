import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'


export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    })

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      })
    }

    const userClearRecord = conversation.clearedFor.find(
      item => String(item.user) === String(req.user._id)
    )

    const messageFilter = {
      conversation: conversationId
    }

    if (userClearRecord) {
      messageFilter.createdAt = {
        $gt: userClearRecord.clearedAt
      }
    }

    const messages = await Message.find(messageFilter)
      .populate('sender', 'username email avatar')
      .sort({ createdAt: 1 })

    res.json({ messages })
  } catch (error) {
    console.error('Get messages error:', error)

    res.status(500).json({
      message: 'Failed to get messages'
    })
  }
}


export const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      text,
      replyTo,
      messageType = 'text',
      fileUrl = ''
    } = req.body

    if (!conversationId) {
      return res.status(400).json({
        message: 'Conversation ID is required'
      })
    }

    if (messageType === 'text' && !text?.trim()) {
      return res.status(400).json({
        message: 'Message cannot be empty'
      })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    })

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      })
    }

    const message = await Message.create({
  sender: req.user._id,
  conversation: conversationId,
  text,
  replyTo: replyTo || null
})

    conversation.lastMessage = message._id

    await conversation.save()

    const populatedMessage = await Message.findById(
  message._id
)
  .populate(
    'sender',
    'username email avatar'
  )
  .populate({
    path: 'replyTo',
    populate: {
      path: 'sender',
      select: 'username'
    }
  })

    res.status(201).json({
      message: populatedMessage
    })
  } catch (error) {
    console.error('Send message error:', error)

    res.status(500).json({
      message: 'Failed to send message'
    })
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params

    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      })
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You can only delete your own messages'
      })
    }

    message.isDeleted = true
    message.text = 'This message was deleted'

    await message.save()

    res.json({
      message: 'Message deleted',
      deletedMessage: message
    })
  } catch (error) {
    console.error('Delete message error:', error)

    res.status(500).json({
      message: 'Failed to delete message'
    })
  }
}

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const { text } = req.body

    if (!text?.trim()) {
      return res.status(400).json({
        message: 'Message cannot be empty'
      })
    }

    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      })
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You can only edit your own messages'
      })
    }

    if (message.isDeleted) {
      return res.status(400).json({
        message: 'Deleted messages cannot be edited'
      })
    }

    message.text = text.trim()

    await message.save()

    const updatedMessage = await Message.findById(
      message._id
    ).populate(
      'sender',
      'username email avatar'
    )

    res.json({
      message: 'Message updated',
      updatedMessage
    })
  } catch (error) {
    console.error('Edit message error:', error)

    res.status(500).json({
      message: 'Failed to edit message'
    })
  }
}


export const clearChat = async (req, res) => {
  try {
    const { conversationId } = req.params

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    })

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      })
    }

    const userId = String(req.user._id)
    const existingRecord = conversation.clearedFor.find(
      item => String(item.user) === userId
    )

    const clearedAt = new Date()

    if (existingRecord) {
      existingRecord.clearedAt = clearedAt
    } else {
      conversation.clearedFor.push({
        user: req.user._id,
        clearedAt
      })
    }

    await conversation.save()

    res.json({
      message: 'Chat cleared for you',
      conversationId,
      clearedAt
    })
  } catch (error) {
    console.error('Clear chat error:', error)

    res.status(500).json({
      message: 'Failed to clear chat'
    })
  }
}
