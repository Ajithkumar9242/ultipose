import axios from "axios"
import { toast } from "react-hot-toast"

// ✅ always call relative URL so Vite proxy works
const api = axios.create({
  baseURL: "",
  withCredentials: true
})

const GUEST_METHODS = [
  "/api/method/ultipos.api.store.ping",
  "/api/method/ultipos.api.store.get_store",
  "/api/method/ultipos.api.store.get_stores",
  "/api/method/ultipos.api.menu.get_menu",
  "/api/method/ultipos.api.coupon.get_active",
  "/api/method/ultipos.api.coupon.validate_coupon",
  "/api/method/ultipos.api.checkout.create_or_update",
  "/api/method/ultipos.api.order.place",
  "/api/method/ultipos.api.order.get_status"
]

api.interceptors.request.use(
  (config) => {
    const isGuest = GUEST_METHODS.some((p) => config.url?.includes(p))

    if (!isGuest) {
      const token = localStorage.getItem("token")
      if (token) config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err?.response?.data || err.message)

    const msg =
      err?.response?.data?._server_messages
        ? JSON.parse(err.response.data._server_messages)?.[0]
        : err?.response?.data?.message || err?.message || "Something went wrong"

    toast.error(typeof msg === "string" ? msg : "Something went wrong")
    return Promise.reject(err)
  }
)

export default api
