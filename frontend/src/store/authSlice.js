import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../services/api'

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/signup', userData)

      localStorage.setItem(
        'buddychat_token',
        response.data.token
      )

      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Signup failed'
      )
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', userData)

      localStorage.setItem(
        'buddychat_token',
        response.data.token
      )

      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      )
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')

      return response.data.user
    } catch (error) {
      localStorage.removeItem('buddychat_token')

      return rejectWithValue(
        error.response?.data?.message || 'Session expired'
      )
    }
  }
)

const initialState = {
  user: null,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    logout: (state) => {
      state.user = null
      state.error = null

      localStorage.removeItem('buddychat_token')
    },

    clearError: (state) => {
      state.error = null
    },

    updateUser: (state, action) => {
    if (state.user) {
      state.user = {
        ...state.user,
        ...action.payload
      }
    }
  }
  },

  extraReducers: (builder) => {
    builder

      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
      })

      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })

      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })

      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false
        state.user = null
      })
  }
})

export const {
  logout,
  clearError,
  updateUser
} = authSlice.actions

export default authSlice.reducer