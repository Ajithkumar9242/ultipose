// src/redux/locationSlice.js
import { createSlice } from "@reduxjs/toolkit"

// Load from localStorage (per-store)
const loadLocationState = () => {
  if (typeof window === "undefined") return { byStore: {} }

  try {
    const saved = localStorage.getItem("locationSlice")
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

// Shape: { byStore: { [storeCode]: { type, data } } }
const initialState = loadLocationState()

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    // payload: { storeCode, type, data }
    setLocation(state, action) {
      const { storeCode, type, data } = action.payload || {}
      if (!storeCode) return

      if (!state.byStore) state.byStore = {}
      state.byStore[storeCode] = {
        type: type || "delivery",
        data: data || ""
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("locationSlice", JSON.stringify(state))
        } catch (e) {
          console.error("Failed to save locationSlice", e)
        }
      }
    },

    // optional if ever needed
    clearLocation(state, action) {
      const storeCode = action.payload
      if (!storeCode || !state.byStore) return

      if (state.byStore[storeCode]) {
        delete state.byStore[storeCode]
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("locationSlice", JSON.stringify(state))
        } catch (e) {
          console.error("Failed to save locationSlice", e)
        }
      }
    }
  }
})

export const { setLocation, clearLocation } = locationSlice.actions
export default locationSlice.reducer
