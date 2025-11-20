// src/redux/userSlice.js
import { createSlice } from "@reduxjs/toolkit"

// Load from localStorage (if present)
const loadUserState = () => {
  if (typeof window === "undefined") return { byStore: {} }

  try {
    const saved = localStorage.getItem("userSlice")
    if (!saved) {
      return { byStore: {} }
    }
    const parsed = JSON.parse(saved)
    return {
      byStore: parsed.byStore || {}
    }
  } catch (e) {
    return { byStore: {} }
  }
}

const initialState = loadUserState()
// Shape: { byStore: { [storeCode]: { name, email, phone } } }

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // payload: { storeCode, details: { name, email, phone } }
    setUserDetails(state, action) {
      const { storeCode, details } = action.payload || {}
      if (!storeCode || !details) return

      if (!state.byStore) state.byStore = {}
      state.byStore[storeCode] = details

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("userSlice", JSON.stringify(state))
        } catch (e) {
          console.error("Failed to save userSlice", e)
        }
      }
    },

    // payload: storeCode
    clearUserDetails(state, action) {
      const storeCode = action.payload
      if (!storeCode || !state.byStore) return

      if (state.byStore[storeCode]) {
        delete state.byStore[storeCode]
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("userSlice", JSON.stringify(state))
        } catch (e) {
          console.error("Failed to save userSlice", e)
        }
      }
    },

    // Optional helper if ever needed
    clearAllUserDetails(state) {
      state.byStore = {}
      if (typeof window !== "undefined") {
        localStorage.removeItem("userSlice")
      }
    }
  }
})

export const { setUserDetails, clearUserDetails, clearAllUserDetails } =
  userSlice.actions
export default userSlice.reducer
