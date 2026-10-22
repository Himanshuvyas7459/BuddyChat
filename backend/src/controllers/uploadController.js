
import cloudinary from '../config/cloudinary.js'

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please select a file'
      })
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'Unsupported file type'
      })
    }

    const isImage = req.file.mimetype.startsWith('image/')

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'buddychat',
          resource_type: isImage ? 'image' : 'raw',
          public_id: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          use_filename: false
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      stream.end(req.file.buffer)
    })

    res.status(201).json({
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileType: isImage ? 'image' : 'document',
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    })
  }  catch (error) {
  console.error('Cloudinary upload error:', error)

  res.status(500).json({
    message: error.message || 'File upload failed'
  })
  }
}
