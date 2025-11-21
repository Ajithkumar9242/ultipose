import { toast } from "react-hot-toast"
// src/api.js
import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL || "https://devapi.ulti-pos.com/ultipos-online"   // e.g. "https://devapi.ulti-pos.com/ultipos-online"

// This is the main axios instance you'll use everywhere
const api = axios.create({
  baseURL: API_BASE,      // now you can call api.get("/something")
  // withCredentials: true // uncomment if your backend uses cookies
})

// ✅ OPTIONAL: add a request interceptor (for auth token etc.)
api.interceptors.request.use(
  config => {
    // Example: attach token if exists
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ✅ Response interceptor – logs errors in one place
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status

    // 🔥 Check for 404 and redirect
    if (status === 404) {
      toast.error("Page not found — redirecting...")
      window.location.href = "/"        // redirect to homepage
      return
    }

    // Default error handler
    console.error("API error:", error?.response?.data || error.message)
    toast.error(error?.response?.data?.message || "Something went wrong")

    return Promise.reject(error)
  }
)


export default api
