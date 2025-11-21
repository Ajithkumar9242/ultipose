
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '' // e.g., http://localhost:5000

const api = axios.create({
  baseURL: API_BASE,
})

// Optional interceptor to show errors
api.interceptors.response.use(
  r => r,
  err => {
    console.error('API error', err?.response?.data || err.message)
    throw err
  }
)

export default api
