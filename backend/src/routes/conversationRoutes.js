import express from 'express'
import protect from '../middleware/authMiddleware.js'
import {
  createConversation,
  getConversations,
  createGroupConversation,
  updateGroupConversation

} from '../controllers/conversationController.js'

const router = express.Router()

router.post('/', protect, createConversation)
router.get('/', protect, getConversations)
router.post(
  '/group',
  protect,
  createGroupConversation
)
router.put('/:conversationId/group', protect, updateGroupConversation)

export default router