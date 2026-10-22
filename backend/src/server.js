import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import conversationRoutes from './routes/conversationRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import socketHandler from './sockets/socketHandler.js'
import uploadRoutes from './routes/uploadRoutes.js'


const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
})

app.set('io', io)

connectDB()

app.use(cors({
  origin: process.env.CLIENT_URL
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'BuddyChat API is running'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/uploads', uploadRoutes)

socketHandler(io)

const PORT = process.env.PORT || 8080

httpServer.listen(PORT, () => {
  console.log(`BuddyChat server running on port ${PORT}`)
})