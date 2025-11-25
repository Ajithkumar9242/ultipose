// src/redux/locationSlice.js
import { createSlice } from "@reduxjs/toolkit"

// Load from localStorage (global + per-store)
const loadLocationState = () => {
  if (typeof window === "undefined") return { byStore: {}, global: null }

  try {
    const saved = localStorage.getItem("locationSlice")
    if (!saved) {
      return {
        byStore: {},
        global: null
      }
    }
    const parsed = JSON.parse(saved)
    return {
      byStore: parsed.byStore || {},
      // 🌍 global location for homepage (coords + address + userDetails)
      global: parsed.global || null
    }
  } catch (e) {
    return { byStore: {}, global: null }
  }
}

// Shape:
// {
//   byStore: { [storeCode]: { type, data } },
//   global: { type, address, coords, userDetails } | null
// }
const initialState = loadLocationState()

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    /**
     * setLocation has 2 modes:
     * 1) Per-store (Checkout / OrderPage):
     *    payload: { storeCode, type, data }
     * 2) Global (Home page / root "/"):
     *    payload: { type, address, coords, userDetails }
     */
    setLocation(state, action) {
      const {
        storeCode,
        type,
        data,
        address,
        coords,
        userDetails
      } = action.payload || {}

      // 🏪 Per-store location (kept for existing usage in Checkout / OrderPage)
      if (storeCode) {
        if (!state.byStore) state.byStore = {}
        state.byStore[storeCode] = {
          type: type || "delivery",
          data: data || ""
        }
      } else {
        // 🌍 Global location for homepage
        state.global = {
          type: type || "auto", // "auto" or "manual"
          address: address || data || "",
          coords: coords || null, // { lat, lon }
          userDetails: userDetails || null // { name, street, city, zip } or null
        }
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("locationSlice", JSON.stringify(state))
        } catch (e) {
          console.error("Failed to save locationSlice", e)
        }
      }
    },

    // Clear per-store only (used by existing code if needed)
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
    },

    // (Optional helper) clear global homepage location
    clearGlobalLocation(state) {
      state.global = null
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

export const { setLocation, clearLocation, clearGlobalLocation } =
  locationSlice.actions
export default locationSlice.reducer
