// src/redux/userSlice.js
import { createSlice } from "@reduxjs/toolkit"

// Load from localStorage (if present)
const loadUserDetails = () => {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem("userDetails")
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    return null
  }
}

const initialState = {
  details: loadUserDetails() // { email, phone } or null
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails(state, action) {
      state.details = action.payload

      // Persist to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("userDetails", JSON.stringify(action.payload))
        } catch (e) {
          console.error("Failed to save userDetails", e)
        }
      }
    },
    clearUserDetails(state) {
      state.details = null
      if (typeof window !== "undefined") {
        localStorage.removeItem("userDetails")
      }
    }
  }
})

export const { setUserDetails, clearUserDetails } = userSlice.actions
export default userSlice.reducer
