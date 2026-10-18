import express from 'express'
import protect from '../middleware/authMiddleware.js'
import {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage
} from '../controllers/messageController.js'

const router = express.Router()

router.get('/:conversationId', protect, getMessages)
router.post('/', protect, sendMessage)
router.delete('/:messageId', protect, deleteMessage)
router.put('/:messageId', protect, editMessage)

export default router