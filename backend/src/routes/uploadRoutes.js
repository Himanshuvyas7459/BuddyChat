
import express from 'express'
import protect from '../middleware/authMiddleware.js'
import upload from '../middleware/uploadMiddleware.js'
import { uploadFile } from '../controllers/uploadController.js'

const router = express.Router()

router.post('/', protect, upload.single('file'), uploadFile)

export default router
