import axios from "axios"
import { toast } from "react-hot-toast"

// ✅ Set global defaults
axios.defaults.baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

axios.defaults.withCredentials = true
axios.defaults.headers.common["Content-Type"] = "application/json"

// ── Request interceptor ──
axios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ──
let isRedirecting = false

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const status = error.response?.status
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Session expired. Please login again."

      if (status === 401 && !isRedirecting) {
        isRedirecting = true

        localStorage.removeItem("token")

        toast.error(message)

        setTimeout(() => {
          window.location.href = "/login"
        }, 1200)
      } 
    }

    return Promise.reject(error)
  }
)

export default axios