import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import EmojiPicker from 'emoji-picker-react'
import {
  MessageCircle,
  Search,
  Send,
  Users,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  LogOut,
  UserPlus,
  Trash2,
  Pencil,
  Check,
  CheckCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import socket from '../services/socket'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const [conversations, setConversations] = useState([])
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [selectedConversation, setSelectedConversation] =
    useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [messageMenuId, setMessageMenuId] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [showCreateGroup, setShowCreateGroup] =
  useState(false)
  const fileInputRef = useRef(null)
const [uploadingFile, setUploadingFile] = useState(false)

const [showEmojiPicker, setShowEmojiPicker] = useState(false)
const [groupName, setGroupName] = useState('')
const [groupUsers, setGroupUsers] = useState([])
const [groupSearch, setGroupSearch] = useState('')
const [showGroupInfo, setShowGroupInfo] = useState(false)
const [editingGroupName, setEditingGroupName] = useState(false)
const [newGroupName, setNewGroupName] = useState('')
const [groupSearchUsers, setGroupSearchUsers] =
  useState([])

  const messagesEndRef = useRef(null)
  const [highlightedMessageId, setHighlightedMessageId] =
  useState(null)

  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem('buddychat_unread_counts') || '{}'
    )
  } catch {
    return {}
  }
})
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')
  const [typingTimeout, setTypingTimeout] =
    useState(null)

    
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

  
useEffect(() => {
  localStorage.setItem(
    'buddychat_unread_counts',
    JSON.stringify(unreadCounts)
  )
}, [unreadCounts])


  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages, typingUser])

  const loadConversations = async () => {
    try {
      const response = await api.get('/conversations')

      setConversations(response.data.conversations)
    } catch (error) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (value) => {
    setSearch(value)

    if (!value.trim()) {
      setUsers([])
      return
    }

    try {
      const response = await api.get(
        `/users/search?q=${encodeURIComponent(value)}`
      )

      setUsers(response.data.users)
    } catch (error) {
      console.error(error)
    }
  }

  const startConversation = async (userId) => {
    try {
      const response = await api.post('/conversations', {
        userId: String(userId)
      })

      const conversation = response.data.conversation

      setSelectedConversation(conversation)

      setUsers([])
      setSearch('')

      setConversations((prev) => {
        const exists = prev.some(
          (item) => item._id === conversation._id
        )

        if (exists) {
          return prev.map((item) =>
            item._id === conversation._id
              ? conversation
              : item
          )
        }

        return [conversation, ...prev]
      })

      loadMessages(conversation._id)
    } catch (error) {
      console.error(
        'Start conversation error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
          'Could not start conversation'
      )
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      const response = await api.get(
        `/messages/${conversationId}`
      )

      setMessages(response.data.messages)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const getOtherUser = (conversation) => {
    const currentUserId = String(
      user?._id || user?.id
    )

        return conversation.participants.find(
      (participant) =>
        String(participant._id) !== currentUserId
    )
  }

  const getConversationTitle = (conversation) => {
  if (conversation?.isGroup) {
    return conversation.groupName || 'Group Chat'
  }

  return getOtherUser(conversation)?.username || 'Unknown User'
}

  const handleSelectConversation = (conversation) => {
  setSelectedConversation(conversation)

  setUnreadCounts((prev) => ({
    ...prev,
    [String(conversation._id)]: 0
  }))

  setReplyingTo(null)
  setMessageMenuId(null)
  setEditingMessageId(null)
  setEditingText('')

  loadMessages(conversation._id)
}

  const handleSendMessage = (event) => {
    event.preventDefault()

    if (
      !message.trim() ||
      !selectedConversation ||
      !socket.connected
    ) {
      return
    }

    socket.emit('send-message', {
      conversationId: selectedConversation._id,
      text: message.trim(),
      messageType: 'text',
      replyTo: replyingTo?._id || null
    })

    socket.emit('stop-typing', {
      conversationId: selectedConversation._id
    })

    setIsTyping(false)
    setMessage('')
    setReplyingTo(null)
  }

  
const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]

  if (!file || !selectedConversation || !socket.connected) {
    event.target.value = ''
    return
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (!allowedTypes.includes(file.type)) {
    toast.error('Unsupported file type')
    event.target.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('File size must be 10 MB or less')
    event.target.value = ''
    return
  }

  try {
    setUploadingFile(true)

    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/uploads', formData)

    const uploadedFile = response.data

    socket.emit('send-message', {
      conversationId: selectedConversation._id,
      text: '',
      messageType: uploadedFile.fileType,
      fileUrl: uploadedFile.fileUrl,
      replyTo: replyingTo?._id || null
    })

    setReplyingTo(null)
    toast.success('File sent')
  } catch (error) {
    console.error('File upload error:', error)
    toast.error(error.response?.data?.message || 'File upload failed')
  } finally {
    setUploadingFile(false)
    event.target.value = ''
  }
}


  const handleDeleteMessage = async (messageId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this message?'
    )

    if (!confirmDelete) {
      return
    }

    try {
      await api.delete(`/messages/${messageId}`)

      setMessages((prev) =>
        prev.map((item) => {
          if (item._id !== messageId) {
            return item
          }

          return {
            ...item,
            text: 'This message was deleted',
            isDeleted: true
          }
        })
      )

      socket.emit('delete-message', {
        messageId,
        conversationId: selectedConversation?._id
      })

      if (replyingTo?._id === messageId) {
        setReplyingTo(null)
      }

      toast.success('Message deleted')
    } catch (error) {
      console.error('Delete message error:', error)

      toast.error(
        error.response?.data?.message ||
          'Failed to delete message'
      )
    }
  }

  const handleEditMessage = (item) => {
    setEditingMessageId(item._id)
    setEditingText(item.text)
    setMessageMenuId(null)
  }

  const saveEditedMessage = async (messageId) => {
    if (!editingText.trim()) {
      toast.error('Message cannot be empty')
      return
    }

    try {
      const response = await api.put(
        `/messages/${messageId}`,
        {
          text: editingText.trim()
        }
      )

      const updatedMessage =
        response.data.updatedMessage

      setMessages((prev) =>
        prev.map((item) =>
          item._id === messageId
            ? updatedMessage
            : item
        )
      )

      socket.emit('edit-message', {
        messageId,
        conversationId: selectedConversation?._id,
        text: editingText.trim()
      })

      setEditingMessageId(null)
      setEditingText('')

      toast.success('Message updated')
    } catch (error) {
      console.error('Edit message error:', error)

      toast.error(
        error.response?.data?.message ||
          'Failed to update message'
      )
    }
  }

  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  const handleReplyMessage = (item) => {
    setReplyingTo(item)
    setMessageMenuId(null)
    setEditingMessageId(null)
    setEditingText('')
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const searchGroupUsers = async (value) => {
  setGroupSearch(value)

  if (!value.trim()) {
    setGroupSearchUsers([])
    return
  }

  try {
    const response = await api.get(
      `/users/search?q=${value.trim()}`
    )

    const currentUserId = String(user?._id)

    const filteredUsers =
      response.data.users?.filter(
        (item) =>
          String(item._id) !== currentUserId
      ) || []

    setGroupSearchUsers(filteredUsers)
  } catch (error) {
    console.error(
      'Group user search error:',
      error
    )

    setGroupSearchUsers([])
  }
}

  const handleCreateGroup = async () => {
  if (!groupName.trim()) {
    toast.error('Group name is required')
    return
  }

  if (groupUsers.length === 0) {
    toast.error('Select at least one member')
    return
  }

  try {
    const response = await api.post('/conversations/group', {
      groupName: groupName.trim(),
      userIds: groupUsers.map((item) => item._id)
    })

    const conversation =
      response.data.conversation

    setConversations((prev) => [
      conversation,
      ...prev.filter(
        (item) => item._id !== conversation._id
      )
    ])

    setSelectedConversation(conversation)

    setGroupName('')
    setGroupUsers([])
    setGroupSearch('')
    setGroupSearchUsers([])
    setShowCreateGroup(false)

    loadMessages(conversation._id)

    toast.success('Group created successfully')
  } catch (error) {
    console.error(
      'Create group error:',
      error
    )

    toast.error(
      error.response?.data?.message ||
      'Failed to create group'
    )
  }
}

const handleRenameGroup = async () => {
  if (!newGroupName.trim() || !selectedConversation?._id) {
    return
  }

  try {
    const { data } = await api.put(
      `/conversations/${selectedConversation._id}/group`,
      { groupName: newGroupName.trim() }
    )

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation._id === data.conversation._id
          ? data.conversation
          : conversation
      )
    )

    setSelectedConversation(data.conversation)
    setNewGroupName(data.conversation.groupName)
    setEditingGroupName(false)

    toast.success('Group name updated')
  } catch (error) {
    toast.error(
      error.response?.data?.message || 'Failed to rename group'
    )
  }
}

  const handleJumpToMessage = (messageId) => {
  const messageElement = document.getElementById(
    `message-${messageId}`
  )

  if (!messageElement) {
    return
  }

  messageElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })

  setHighlightedMessageId(messageId)

  setTimeout(() => {
    setHighlightedMessageId(null)
  }, 1500)
}

  // Connect socket
  useEffect(() => {
    const token = localStorage.getItem(
      'buddychat_token'
    )

    if (!token) {
      return
    }

    socket.auth = {
      token
    }

    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [])

  // Join selected conversation
  useEffect(() => {
    setTypingUser('')

    if (!selectedConversation) {
      return
    }

    socket.emit(
      'join-conversation',
      selectedConversation._id
    )

    return () => {
      socket.emit(
        'leave-conversation',
        selectedConversation._id
      )
    }
  }, [selectedConversation])

  // Receive new messages
useEffect(() => {
  const handleNewMessage = (newMessage) => {
    const conversationId = String(
      newMessage.conversation?._id ||
      newMessage.conversation ||
      ''
    )

    const selectedId = String(
      selectedConversation?._id || ''
    )

    const currentUserId = String(
      user?._id || user?.id || ''
    )

    const senderId = String(
      newMessage.sender?._id || newMessage.sender || ''
    )

    const isOwnMessage = senderId === currentUserId
    const isCurrentChat = conversationId === selectedId

    

setConversations((prev) => {
  const exists = prev.some(
    (conversation) =>
      String(conversation._id) === conversationId
  )

  const updatedConversations = prev.map((conversation) => {
    if (String(conversation._id) !== conversationId) {
      return conversation
    }

    return {
      ...conversation,
      lastMessage: newMessage,
      updatedAt: newMessage.createdAt
    }
  })

  if (!exists) {
    return updatedConversations
  }

  return [...updatedConversations].sort((a, b) => {
    const dateA = new Date(
      a.lastMessage?.createdAt || a.updatedAt || 0
    ).getTime()

    const dateB = new Date(
      b.lastMessage?.createdAt || b.updatedAt || 0
    ).getTime()

    return dateB - dateA
  })
})


    
if (!isOwnMessage && !isCurrentChat) {
  setUnreadCounts((prev) => ({
    ...prev,
    [conversationId]: (prev[conversationId] || 0) + 1
  }))

  if (
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    const senderName =
      newMessage.sender?.username || 'New message'

    const messageText =
      newMessage.messageType === 'text'
        ? newMessage.text
        : 'Sent an attachment'

    const notification = new Notification(senderName, {
      body: messageText || 'You received a new message',
      icon: '/favicon.ico',
      tag: conversationId
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }
}

    if (isCurrentChat) {
      setMessages((prev) => {
        if (prev.some((message) => message._id === newMessage._id)) {
          return prev
        }

        return [...prev, newMessage]
      })

      if (!isOwnMessage) {
        socket.emit('message-delivered', {
          messageId: newMessage._id,
          conversationId
        })

        socket.emit('message-seen', {
          messageId: newMessage._id,
          conversationId
        })
      }
    }
  }

  socket.on('new-message', handleNewMessage)

  return () => {
    socket.off('new-message', handleNewMessage)
  }
}, [selectedConversation, user])


  // Delivered and seen status
  useEffect(() => {
    const handleDelivered = ({
      messageId,
      conversationId
    }) => {
      if (
        String(conversationId) !==
        String(selectedConversation?._id)
      ) {
        return
      }

      setMessages((prev) =>
        prev.map((item) => {
          if (item._id !== messageId) {
            return item
          }

          return {
            ...item,
            isDelivered: true
          }
        })
      )
    }

    const handleSeen = ({
      messageId,
      conversationId
    }) => {
      if (
        String(conversationId) !==
        String(selectedConversation?._id)
      ) {
        return
      }

      setMessages((prev) =>
        prev.map((item) => {
          if (item._id !== messageId) {
            return item
          }

          return {
            ...item,
            isDelivered: true,
            isSeen: true
          }
        })
      )
    }

    socket.on(
      'message-delivered',
      handleDelivered
    )

    socket.on(
      'message-seen',
      handleSeen
    )

    return () => {
      socket.off(
        'message-delivered',
        handleDelivered
      )

      socket.off(
        'message-seen',
        handleSeen
      )
    }
  }, [selectedConversation])

  useEffect(() => {
  const handleMessageDeleted = ({
    messageId,
    conversationId
  }) => {
    if (
      String(conversationId) !==
      String(selectedConversation?._id)
    ) {
      return
    }

    setMessages((prev) =>
      prev.map((item) => {
        if (item._id !== messageId) {
          return item
        }

        return {
          ...item,
          text: 'This message was deleted',
          isDeleted: true
        }
      })
    )
  }

  socket.on(
    'message-deleted',
    handleMessageDeleted
  )

  return () => {
    socket.off(
      'message-deleted',
      handleMessageDeleted
    )
  }
}, [selectedConversation])

  useEffect(() => {
  const handleMessageEdited = ({
    messageId,
    conversationId,
    text
  }) => {
    if (
      String(conversationId) !==
      String(selectedConversation?._id)
    ) {
      return
    }

    setMessages((prev) =>
      prev.map((item) => {
        if (item._id !== messageId) {
          return item
        }

        return {
          ...item,
          text
        }
      })
    )
  }

  socket.on(
    'message-edited',
    handleMessageEdited
  )

  return () => {
    socket.off(
      'message-edited',
      handleMessageEdited
    )
  }
}, [selectedConversation])


useEffect(() => {
  requestNotificationPermission()
}, [])

  // Typing indicator
  useEffect(() => {
    const handleTyping = (data) => {
      if (
        String(data.conversationId) !==
        String(selectedConversation?._id)
      ) {
        return
      }

      setTypingUser(data.username)
    }

    const handleStopTyping = (data) => {
      if (
        String(data.conversationId) !==
        String(selectedConversation?._id)
      ) {
        return
      }

      setTypingUser('')
    }

    socket.on(
      'user-typing',
      handleTyping
    )

    socket.on(
      'user-stop-typing',
      handleStopTyping
    )

    return () => {
      socket.off(
        'user-typing',
        handleTyping
      )

      socket.off(
        'user-stop-typing',
        handleStopTyping
      )
    }
  }, [selectedConversation])


useEffect(() => {
  const handleGroupCreated = (conversation) => {
    setConversations((prev) => {
      const alreadyExists = prev.some(
        (item) => item._id === conversation._id
      )

      if (alreadyExists) {
        return prev
      }

      return [conversation, ...prev]
    })
  }

  socket.on('group-created', handleGroupCreated)

  return () => {
    socket.off('group-created', handleGroupCreated)
  }
}, [])

  
useEffect(() => {
  const handleGroupUpdated = (updatedConversation) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation._id === updatedConversation._id
          ? updatedConversation
          : conversation
      )
    )

    setSelectedConversation((prev) =>
      prev?._id === updatedConversation._id
        ? updatedConversation
        : prev
    )
  }

  socket.on('group-updated', handleGroupUpdated)

  return () => {
    socket.off('group-updated', handleGroupUpdated)
  }
}, [])


  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-white flex">

      {/* Sidebar */}

      <aside className="w-[360px] h-full min-h-0 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">

        {/* Header */}

        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <MessageCircle size={22} />
            </div>

            <div>
              <h1 className="font-bold text-lg">
                BuddyChat
              </h1>

              <p className="text-xs text-slate-400">
                Chat. Connect. Chill.
              </p>
            </div>

          </div>

          <button
  type="button"
  onClick={() => setShowCreateGroup(true)}
  className="p-2 cursor-pointer hover:bg-slate-800 rounded-lg"
  title="Create group"
>
  <Users size={20} />
</button>

        </div>

        {/* Search */}

        <div className="p-4 relative">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                searchUsers(event.target.value)
              }
              placeholder="Search people..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-red-500 cursor-text"
            />

          </div>

          {/* Search results */}

          {users.length > 0 && (

            <div className="absolute left-4 right-4 top-[68px] z-20 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">

              {users.map((item) => (

                <button
                  key={item._id}
                  onClick={() =>
                    startConversation(item._id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left cursor-pointer"
                >

                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-semibold">
                    {item.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-medium">
                      {item.username}
                    </p>

                    <p className="text-xs text-slate-400">
                      {item.email}
                    </p>
                  </div>

                  <UserPlus
                    size={18}
                    className="ml-auto text-slate-400"
                  />

                </button>

              ))}

            </div>

          )}

        </div>

        {/* Conversations */}

        <div className="flex-1 min-h-0 overflow-y-auto">

          {loading ? (

            <div className="p-6 text-center text-slate-500">
              Loading chats...
            </div>

          ) : conversations.length === 0 ? (

            <div className="p-8 text-center">

              <MessageCircle
                size={40}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-slate-400">
                No conversations yet
              </p>

              <p className="text-sm text-slate-600 mt-1">
                Search for someone to start chatting
              </p>

            </div>

          ) : (

            conversations.map((conversation) => {

              const otherUser =
                getOtherUser(conversation)

              return (

                <button
                  key={conversation._id}
                  onClick={() =>
                    handleSelectConversation(
                      conversation
                    )
                  }
                  className={`w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left border-b border-slate-800 hover:bg-slate-800 ${
                    selectedConversation?._id ===
                    conversation._id
                      ? 'bg-slate-800'
                      : ''
                  }`}
                >

                  <div className="relative">

                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-lg">
                      {conversation.isGroup
  ? conversation.groupName
      ?.charAt(0)
      ?.toUpperCase()
  : otherUser?.username
      ?.charAt(0)
      ?.toUpperCase()}
                    </div>

                    {!conversation.isGroup && otherUser?.isOnline && (
  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" />
)}

                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center justify-between gap-2">

  <p className="font-medium truncate">
    {getConversationTitle(conversation)}
  </p>

  {(unreadCounts[String(conversation._id)] || 0) > 0 && (
    <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
      {unreadCounts[String(conversation._id)] > 99
        ? '99+'
        : unreadCounts[String(conversation._id)]}
    </span>
  )}

</div>

                    <p className="text-sm text-slate-500 truncate mt-1">
                      {conversation.lastMessage?.text ||
                        'Start a conversation'}
                    </p>

                  </div>

                </button>

              )
            })

          )}

        </div>

        {/* Current user */}

        <div className="border-t border-slate-800 p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-semibold">
            {user?.username
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">

            <p className="font-medium truncate">
              {user?.username}
            </p>

            <p className="text-xs text-green-400">
              Online
            </p>

          </div>

          <button
            onClick={() => {
              localStorage.removeItem(
                'buddychat_token'
              )

              window.location.href = '/login'
            }}
            className="p-2 text-slate-400 cursor-pointer hover:text-red-400 hover:bg-slate-800 rounded-lg"
          >
            <LogOut size={19} />
          </button>

        </div>

      </aside>

      {showCreateGroup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Create New Group
          </h2>

          <p className="text-sm text-slate-400">
            Add people to your group
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateGroup(false)
            setGroupName('')
            setGroupSearch('')
            setGroupSearchUsers([])
            setGroupUsers([])
          }}
          className="text-slate-400 hover:text-white text-2xl cursor-pointer"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-5">

        {/* Group Name */}
        <label className="block text-sm text-slate-300 mb-2">
          Group Name
        </label>

        <input
          type="text"
          value={groupName}
          onChange={(event) =>
            setGroupName(event.target.value)
          }
          placeholder="Enter group name"
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-red-500"
        />

        {/* Search Members */}
        <label className="block text-sm text-slate-300 mt-5 mb-2">
          Add Members
        </label>

        <input
          type="text"
          value={groupSearch}
          onChange={(event) =>
            searchGroupUsers(event.target.value)
          }
          placeholder="Search users..."
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-red-500"
        />

        {/* Selected Members */}
        {groupUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {groupUsers.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-300 rounded-full px-3 py-1.5 text-sm"
              >
                <span>
                  {item.username}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setGroupUsers((prev) =>
                      prev.filter(
                        (user) =>
                          user._id !== item._id
                      )
                    )
                  }
                  className="text-red-300 hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {groupSearchUsers.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800">

            {groupSearchUsers.map((item) => {
              const isSelected =
                groupUsers.some(
                  (user) =>
                    user._id === item._id
                )

              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setGroupUsers((prev) =>
                        prev.filter(
                          (user) =>
                            user._id !== item._id
                        )
                      )
                    } else {
                      setGroupUsers((prev) => [
                        ...prev,
                        item
                      ])
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                      {item.username
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="text-left">
                      <p className="text-white text-sm font-medium">
                        {item.username}
                      </p>

                      <p className="text-slate-400 text-xs">
                        {item.email}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`text-xs ${
                      isSelected
                        ? 'text-green-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isSelected
                      ? 'Selected'
                      : 'Add'}
                  </span>
                </button>
              )
            })}

          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-700">

        <button
          type="button"
          onClick={() => {
            setShowCreateGroup(false)
            setGroupName('')
            setGroupSearch('')
            setGroupSearchUsers([])
            setGroupUsers([])
          }}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleCreateGroup}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
        >
          Create Group
        </button>

      </div>

    </div>
  </div>
)}

      {/* Chat area */}

{showGroupInfo && selectedConversation?.isGroup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-800 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Group Details</h2>

        <button
          type="button"
          onClick={() => setShowGroupInfo(false)}
          className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
        >
          &times;
        </button>
      </div>

      <div className="mb-5 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-3xl font-bold text-white">
          {selectedConversation.groupName?.charAt(0)?.toUpperCase() || 'G'}
        </div>

        
{editingGroupName ? (
  <div className="mt-3 flex w-full gap-2">
    <input
      value={newGroupName}
      onChange={(e) => setNewGroupName(e.target.value)}
      placeholder="Enter group name"
      maxLength={50}
      className="min-w-0 flex-1 rounded-lg border px-3 py-2 outline-none focus:border-red-500"
    />

    <button
      type="button"
      onClick={handleRenameGroup}
      className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      Save
    </button>
  </div>
) : (
  <div className="mt-3 flex items-center gap-2">
    <h3 className="text-lg font-semibold">
      {selectedConversation.groupName || 'Group Chat'}
    </h3>

    <button
      type="button"
      onClick={() => {
        setNewGroupName(selectedConversation.groupName || '')
        setEditingGroupName(true)
      }}
      className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-500"
      title="Edit group name"
    >
      <Pencil size={16} />
    </button>
  </div>
)}

        <p className="text-sm text-gray-500">
          {selectedConversation.participants?.length || 0} members
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-3 font-semibold">Group Members</h3>

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {selectedConversation.participants?.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700">
                {member.username?.charAt(0)?.toUpperCase() || '?'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.username || 'Unknown User'}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {member._id === (user?._id || user?.id)
                    ? 'You'
                    : member.email || 'Group member'}
                </p>
              </div>

              {member.isOnline && (
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowGroupInfo(false)}
        className="mt-5 w-full rounded-xl bg-red-500 py-3 font-semibold text-white hover:bg-red-600"
      >
        Close
      </button>
    </div>
  </div>
)}

      <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">

        {!selectedConversation ? (

          <div className="flex-1 flex items-center justify-center">

            <div className="text-center max-w-md">

              <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto">

                <MessageCircle
                  size={40}
                  className="text-red-500"
                />

              </div>

              <h2 className="text-2xl font-bold mt-6">
                Welcome to BuddyChat
              </h2>

              <p className="text-slate-500 mt-2">
                Select a conversation or search for
                someone to start chatting.
              </p>

            </div>

          </div>

        ) : (

          <>

            {/* Chat header */}

            <header className="h-[76px] border-b border-slate-800 bg-slate-900 flex items-center px-6">

              {(() => {
                const otherUser =
                  getOtherUser(
                    selectedConversation
                  )

                return (
                  <>

                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold">
                      {selectedConversation?.isGroup
  ? selectedConversation.groupName
      ?.charAt(0)
      ?.toUpperCase()
  : otherUser?.username
      ?.charAt(0)
      ?.toUpperCase()}
                    </div>

                    <div className="ml-3">

                      <h2 className="font-semibold">
                        {selectedConversation?.isGroup ? (
  <button
    type="button"
    onClick={() => setShowGroupInfo(true)}
    className="text-left font-semibold hover:underline cursor-pointer"
  >
    {selectedConversation.groupName || 'Group Chat'}
  </button>
) : (
  <h2 className="font-semibold">
    {getConversationTitle(selectedConversation)}
  </h2>
)}
                      </h2>

                      <p
  className={`text-xs ${
    typingUser
      ? 'text-red-400'
      : selectedConversation?.isGroup
        ? 'text-slate-400'
        : otherUser?.isOnline
          ? 'text-green-400'
          : 'text-slate-500'
  }`}
>
  {typingUser
    ? `${typingUser} is typing...`
    : selectedConversation?.isGroup
      ? `${selectedConversation.participants?.length || 0} members`
      : otherUser?.isOnline
        ? 'Online'
        : 'Offline'}
</p>

                    </div>

                    <div className="ml-auto flex items-center gap-2">

                      <button
                        type="button"
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                      >
                        <Phone size={19} />
                      </button>

                      <button
                        type="button"
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                      >
                        <Video size={20} />
                      </button>

                      <button
                        type="button"
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                      >
                        <MoreVertical size={20} />
                      </button>

                    </div>

                  </>
                )
              })()}

            </header>

            {/* Messages */}

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">

              {messages.length === 0 ? (

                <div className="h-full flex items-center justify-center">

                  <p className="text-slate-600">
                    No messages yet. Say hello 👋
                  </p>

                </div>

              ) : (

                messages.map((item) => {
                  const currentUserId = String(
                    user?._id || user?.id
                  )

                  const ownMessage =
                    String(item.sender?._id) === currentUserId

                  return (
                    <div
                      key={item._id}
                      id={`message-${item._id}`}
                      className={`flex ${
                        ownMessage
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`relative max-w-[65%] px-4 py-2.5 rounded-2xl ${
  highlightedMessageId === item._id
    ? 'ring-2 ring-yellow-400'
    : ''
} ${
                          ownMessage
                            ? 'bg-red-500 text-white rounded-br-md'
                            : 'bg-slate-800 text-slate-200 rounded-bl-md'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                          {selectedConversation?.isGroup && !ownMessage && (
  <p className="text-xs font-semibold text-red-300 mb-1">
    {item.sender?.username || item.sender?.name || 'Unknown'}
  </p>
)}
                            {item.replyTo && (
                              <div
                              onClick={() =>
    handleJumpToMessage(item.replyTo._id)
  }
                                className={`mb-2 rounded-lg border-l-2 px-3 py-2 ${
                                  ownMessage
                                    ? 'bg-red-600/60 border-red-200'
                                    : 'bg-slate-700 border-red-400'
                                }`}
                              >
                                <p
                                  className={`text-[11px] font-semibold ${
                                    ownMessage
                                      ? 'text-red-100'
                                      : 'text-red-300'
                                  }`}
                                >
                                  {item.replyTo.sender?.username ||
                                    'Message'}
                                </p>

                                <p className="text-xs opacity-80 truncate mt-0.5">
                                  {item.replyTo.text ||
                                    'This message was deleted'}
                                </p>
                              </div>
                            )}

                            
{editingMessageId === item._id ? (
  <div className="space-y-2">
    <input
      type="text"
      value={editingText}
      onChange={(e) => setEditingText(e.target.value)}
      autoFocus
      className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-sm"
    />

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={cancelEditMessage}
        className="text-xs opacity-80 hover:opacity-100 cursor-pointer"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={() => saveEditedMessage(item._id)}
        className="text-xs font-medium hover:opacity-80 cursor-pointer"
      >
        Save
      </button>
    </div>
  </div>
) : item.isDeleted ? (
  <p className="break-words italic opacity-70">
    This message was deleted
  </p>
) : (
  <div className="space-y-2">
    {item.messageType === 'image' && item.fileUrl && (
      <a
        href={item.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="block max-w-xs cursor-pointer"
      >
        <img
          src={item.fileUrl}
          alt="Shared image"
          loading="lazy"
          className="max-h-72 w-full rounded-lg object-contain"
        />
      </a>
    )}

    
{item.messageType === 'document' && item.fileUrl && (
  <a
    href={item.fileUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-2 flex max-w-xs items-center gap-3 rounded-lg border border-white/20 bg-black/10 p-3 hover:bg-black/20 cursor-pointer"
  >
    <span className="text-2xl shrink-0">📄</span>

    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium">
        {item.fileName || 'Shared document'}
      </span>
      <span className="block text-xs opacity-70">
        PDF / Document · Click to open
      </span>
    </span>

    <span className="shrink-0">↗</span>
  </a>
)}


    {item.text && (
      <p className="break-words whitespace-pre-wrap">
        {item.text}
      </p>
    )}
  </div>
)}


                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p
                                className={`text-[10px] ${
                                  ownMessage
                                    ? 'text-red-100'
                                    : 'text-slate-400'
                                }`}
                              >
                                {new Date(
                                  item.createdAt
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>

                              {ownMessage && !item.isDeleted && (
                                <span className="shrink-0">
                                  {item.isSeen ? (
                                    <CheckCheck
                                      size={15}
                                      className="text-blue-400"
                                    />
                                  ) : item.isDelivered ? (
                                    <CheckCheck
                                      size={15}
                                      className="text-slate-200"
                                    />
                                  ) : (
                                    <Check
                                      size={15}
                                      className="text-slate-200"
                                    />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {!item.isDeleted && (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setMessageMenuId(
                                    messageMenuId === item._id
                                      ? null
                                      : item._id
                                  )
                                }
                                className="p-1 rounded-full hover:bg-black/20 transition cursor-pointer"
                                title="More"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {messageMenuId === item._id && (
                                <div className="absolute right-0 bottom-7 z-20 w-32 rounded-xl bg-white text-slate-800 shadow-xl border border-slate-200 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReplyMessage(item)
                                    }
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    <MessageCircle size={14} />
                                    Reply
                                  </button>

                                  {ownMessage && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEditMessage(item)
                                        }
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-100 transition cursor-pointer"
                                      >
                                        <Pencil size={14} />
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMessageMenuId(null)
                                          handleDeleteMessage(item._id)
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition cursor-pointer"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })

              )}

              <div ref={messagesEndRef} />

            </div>

            {/* Message input */}

<form
  onSubmit={handleSendMessage}
  className="border-t border-slate-800 bg-slate-900 p-4"
>
  {replyingTo && (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5">
      <div className="min-w-0 border-l-2 border-red-500 pl-3">
        <p className="text-xs font-medium text-red-400">
          Replying to {replyingTo.sender?.username || 'User'}
        </p>

        <p className="text-sm text-slate-300 truncate mt-0.5">
          {replyingTo.text}
        </p>
      </div>

      <button
        type="button"
        onClick={cancelReply}
        className="shrink-0 w-7 h-7 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
        title="Cancel reply"
      >
        ×
      </button>
    </div>
  )}

  <div className="flex items-center gap-3">
    
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.doc,.docx"
  className="hidden"
  onChange={handleFileUpload}
/>

<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={uploadingFile}
  className="p-2.5 text-slate-500 hover:text-white cursor-pointer disabled:opacity-50"
  title={uploadingFile ? 'Uploading file...' : 'Attach file'}
>
  {uploadingFile ? (
    <span className="text-xs">...</span>
  ) : (
    <Paperclip size={21} />
  )}
</button>

    <div className="flex-1 relative">
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-3 z-50">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setMessage((prev) => prev + emojiData.emoji)
            }}
            height={350}
            width={300}
          />
        </div>
      )}

      <input
        value={message}
        onChange={(event) => {
          const value = event.target.value

          setMessage(value)

          if (!selectedConversation) return

          if (typingTimeout) {
            clearTimeout(typingTimeout)
          }

          if (value.trim()) {
            socket.emit('typing', {
              conversationId: selectedConversation._id
            })

            setIsTyping(true)

            const timeout = setTimeout(() => {
              socket.emit('stop-typing', {
                conversationId: selectedConversation._id
              })

              setIsTyping(false)
            }, 1000)

            setTypingTimeout(timeout)
          } else {
            socket.emit('stop-typing', {
              conversationId: selectedConversation._id
            })

            setIsTyping(false)
          }
        }}
        placeholder="Type a message..."
        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 outline-none focus:border-red-500 cursor-text"
      />

      <button
        type="button"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
        className="absolute right-3 top-2.5 cursor-pointer text-slate-500 hover:text-white"
        title="Add emoji"
      >
        <Smile size={21} />
      </button>
    </div>

    <button
      type="submit"
      disabled={!message.trim()}
      className="w-11 h-11 rounded-xl cursor-pointer bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
    >
      <Send size={19} />
    </button>
  </div>
</form>


          </>

        )}

      </main>

    </div>
  )
}

export default Dashboard