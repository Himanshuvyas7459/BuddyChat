import Conversation from '../models/Conversation.js'
import User from '../models/User.js'

export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required'
      })
    }

    if (String(userId) === String(req.user._id)){
      return res.status(400).json({
        message: 'You cannot start a chat with yourself'
      })
    }

    const targetUser = await User.findById(userId)

    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [req.user._id, userId],
        $size: 2
      }
    })
      .populate('participants', 'username email avatar bio isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })

    if (conversation) {
      return res.json({
        conversation
      })
    }

    conversation = await Conversation.create({
      participants: [
        req.user._id,
        userId
      ]
    })

    conversation = await Conversation.findById(conversation._id)
      .populate(
        'participants',
        'username email avatar bio isOnline lastSeen'
      )

    res.status(201).json({
      conversation
    })
  } catch (error) {
    console.error('Create conversation error:', error)

    res.status(500).json({
      message: 'Failed to create conversation'
    })
  }
}

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate(
        'participants',
        'username email avatar bio isOnline lastSeen'
      )
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .sort({
        updatedAt: -1
      })

    res.json({
      conversations
    })
  } catch (error) {
    console.error('Get conversations error:', error)

    res.status(500).json({
      message: 'Failed to get conversations'
    })
  }
}

export const createGroupConversation = async (req, res) => {
  try {
    const { groupName, userIds } = req.body

    if (!groupName?.trim()) {
      return res.status(400).json({
        message: 'Group name is required'
      })
    }

    if (!Array.isArray(userIds) || userIds.length < 1) {
      return res.status(400).json({
        message: 'At least one member is required'
      })
    }

    const uniqueUserIds = [
      ...new Set([
        String(req.user._id),
        ...userIds.map((id) => String(id))
      ])
    ]

    if (uniqueUserIds.length < 2) {
      return res.status(400).json({
        message: 'Group must have at least 2 members'
      })
    }

    // Verify that all selected members exist
    const validUsers = await User.find({
      _id: { $in: uniqueUserIds }
    }).select('_id')

    if (validUsers.length !== uniqueUserIds.length) {
      return res.status(400).json({
        message: 'One or more selected users do not exist'
      })
    }

    const conversation = await Conversation.create({
      participants: uniqueUserIds,
      isGroup: true,
      groupName: groupName.trim()
    })

    const populatedConversation =
      await Conversation.findById(conversation._id)
        .populate(
          'participants',
          'username email avatar bio isOnline lastSeen'
        )

    // Notify group members if Socket.IO is configured
    const io = req.app.get('io')

    
if (io) {
  uniqueUserIds.forEach((userId) => {
    io.to(String(userId)).emit(
      'group-created',
      populatedConversation
    )
  })
}

    return res.status(201).json({
      message: 'Group created successfully',
      conversation: populatedConversation
    })
  } catch (error) {
    console.error('Create group error:', error)

    return res.status(500).json({
      message: error.message || 'Failed to create group'
    })
  }
}


export const updateGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { groupName } = req.body

    if (!groupName?.trim()) {
      return res.status(400).json({
        message: 'Group name is required'
      })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
      isGroup: true
    })

    if (!conversation) {
      return res.status(404).json({
        message: 'Group not found'
      })
    }

    conversation.groupName = groupName.trim()
    await conversation.save()

    const updatedConversation =
      await Conversation.findById(conversation._id)
        .populate(
          'participants',
          'username email avatar bio isOnline lastSeen'
        )

    const io = req.app.get('io')

    if (io) {
      io.to(`conversation:${conversationId}`).emit(
        'group-updated',
        updatedConversation
      )

      for (const member of updatedConversation.participants) {
        io.to(String(member._id)).emit(
          'group-updated',
          updatedConversation
        )
      }
    }

    return res.json({
      message: 'Group name updated successfully',
      conversation: updatedConversation
    })
  } catch (error) {
    console.error('Update group error:', error)

    return res.status(500).json({
      message: error.message || 'Failed to update group'
    })
  }
}
