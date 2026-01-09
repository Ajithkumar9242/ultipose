import axios from "axios"
import { toast } from "react-hot-toast"

const API_BASE = import.meta.env.VITE_API_URL || "http://ultipos.local:8000"

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
})

api.interceptors.request.use(
  config => {
    // ✅ Don't attach auth for guest APIs
    const guestMethods = [
      "/api/method/ultipos.api.store.get_store",
      "/api/method/ultipos.api.menu.get_menu"
    ]

    const isGuestMethod = guestMethods.some(path =>
      config.url?.includes(path)
    )

    if (!isGuestMethod) {
      const token = localStorage.getItem("token")
      if (token) config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    console.error("API error:", error?.response?.data || error.message)
    toast.error(error?.response?.data?.message || "Something went wrong")
    return Promise.reject(error)
  }
)

export default api
