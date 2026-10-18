import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      )

      const user = await User.findById(decoded.userId)

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.user = user

      next()
    } catch (error) {
      next(new Error('Invalid socket authentication'))
    }
  })

  io.on('connection', async (socket) => {
    console.log(
      `Socket connected: ${socket.user.username}`
    )

    await User.findByIdAndUpdate(
      socket.user._id,
      {
        isOnline: true
      }
    )

    socket.join(socket.user._id.toString())

    io.emit('user-online', {
      userId: socket.user._id
    })

    socket.on('join-conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        })

        if (!conversation) {
          return
        }

        socket.join(`conversation:${conversationId}`)

        console.log(
          `${socket.user.username} joined conversation ${conversationId}`
        )
      } catch (error) {
        console.error('Join conversation error:', error.message)
      }
    })

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`)
    })

    socket.on('send-message', async (data) => {
  try {
    const {
      conversationId,
      text,
      messageType = 'text',
      fileUrl = '',
      replyTo = null
    } = data

    if (!conversationId) {
      return
    }

    if (messageType === 'text' && !text?.trim()) {
      return
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: socket.user._id
    })

    if (!conversation) {
      return
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: socket.user._id,
      text: text || '',
      messageType,
      fileUrl,
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

    io.to(`conversation:${conversationId}`).emit(
      'new-message',
      populatedMessage
    )

  } catch (error) {
    console.error(
      'Socket send message error:',
      error.message
    )
  }
})

    socket.on('typing', ({ conversationId }) => {
  socket
    .to(`conversation:${conversationId}`)
    .emit('user-typing', {
      username: socket.user.username,
      conversationId
    })
})

    socket.on('stop-typing', ({ conversationId }) => {
  socket
    .to(`conversation:${conversationId}`)
    .emit('user-stop-typing', {
      conversationId
    })
})

    socket.on(
  'message-delivered',
  async ({ messageId, conversationId }) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      })

      if (!conversation) {
        return
      }

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          conversation: conversationId
        },
        {
          isDelivered: true
        },
        {
          new: true
        }
      )

      if (!message) {
        return
      }

      socket
        .to(`conversation:${conversationId}`)
        .emit('message-delivered', {
          messageId,
          conversationId
        })
    } catch (error) {
      console.error(
        'Message delivered error:',
        error.message
      )
    }
  }
)

socket.on(
  'message-seen',
  async ({ messageId, conversationId }) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      })

      if (!conversation) {
        return
      }

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          conversation: conversationId
        },
        {
          isDelivered: true,
          isSeen: true
        },
        {
          new: true
        }
      )

      if (!message) {
        return
      }

      socket
        .to(`conversation:${conversationId}`)
        .emit('message-seen', {
          messageId,
          conversationId
        })
    } catch (error) {
      console.error(
        'Message seen error:',
        error.message
      )
    }
  }
)

    socket.on(
  'delete-message',
  async ({ messageId, conversationId }) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      })

      if (!conversation) {
        return
      }

      const message = await Message.findOne({
        _id: messageId,
        conversation: conversationId
      })

      if (!message) {
        return
      }

      if (
        String(message.sender) !==
        String(socket.user._id)
      ) {
        return
      }

      message.isDeleted = true
      message.text = 'This message was deleted'

      await message.save()

      socket
        .to(`conversation:${conversationId}`)
        .emit('message-deleted', {
          messageId,
          conversationId
        })
    } catch (error) {
      console.error(
        'Delete message error:',
        error.message
      )
    }
  }
)

    socket.on(
  'edit-message',
  async ({ messageId, conversationId, text }) => {
    try {
      if (!text?.trim()) {
        return
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      })

      if (!conversation) {
        return
      }

      const message = await Message.findOne({
        _id: messageId,
        conversation: conversationId
      })

      if (!message) {
        return
      }

      if (
        String(message.sender) !==
        String(socket.user._id)
      ) {
        return
      }

      if (message.isDeleted) {
        return
      }

      message.text = text.trim()

      await message.save()

      socket
        .to(`conversation:${conversationId}`)
        .emit('message-edited', {
          messageId,
          conversationId,
          text: message.text
        })
    } catch (error) {
      console.error(
        'Edit message error:',
        error.message
      )
    }
  }
)

    socket.on('disconnect', async () => {
      console.log(
        `Socket disconnected: ${socket.user.username}`
      )

      await User.findByIdAndUpdate(
        socket.user._id,
        {
          isOnline: false,
          lastSeen: new Date()
        }
      )

      io.emit('user-offline', {
        userId: socket.user._id,
        lastSeen: new Date()
      })
    })
  })
}

export default socketHandler