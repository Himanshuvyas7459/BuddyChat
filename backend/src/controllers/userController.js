// import User from '../models/User.js'

// export const searchUsers = async (req, res) => {
//   try {
//     const { search } = req.query

//     if (!search || search.trim().length < 2) {
//       return res.json({
//         users: []
//       })
//     }

//     const users = await User.find({
//       _id: { $ne: req.user._id },
//       $or: [
//         {
//           username: {
//             $regex: search,
//             $options: 'i'
//           }
//         },
//         {
//           email: {
//             $regex: search,
//             $options: 'i'
//           }
//         }
//       ]
//     })
//       .select('username email avatar bio isOnline lastSeen')
//       .limit(20)

//     res.json({
//       users
//     })
//   } catch (error) {
//     console.error('Search users error:', error)

//     res.status(500).json({
//       message: 'Failed to search users'
//     })
//   }
// }




import User from '../models/User.js'

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query

    if (!q?.trim()) {
      return res.json({
        users: []
      })
    }

    const users = await User.find({
      _id: {
        $ne: req.user._id
      },
      $or: [
        {
          username: {
            $regex: q.trim(),
            $options: 'i'
          }
        },
        {
          email: {
            $regex: q.trim(),
            $options: 'i'
          }
        }
      ]
    })
      .select('username email avatar bio isOnline lastSeen')
      .limit(20)

    res.json({
      users
    })
  } catch (error) {
    console.error('Search users error:', error)

    res.status(500).json({
      message: 'Failed to search users'
    })
  }
}