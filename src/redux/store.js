// src/redux/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit"
import locationReducer from "./locationSlice"
import userReducer from "./userSlice"   // ⬅️ NEW

// Load from localStorage
const loadCart = () => {
  try {
    const serialized = localStorage.getItem("cart")
    return serialized ? JSON.parse(serialized) : []
  } catch (e) {
    return []
  }
}

// Save to localStorage
const saveCart = cart => {
  try {
    const serialized = JSON.stringify(cart)
    localStorage.setItem("cart", serialized)
  } catch (e) {
    // Ignore write errors
  }
}

// 🔹 helper: normalize add-ons array (order doesn’t matter)
const normalizeAddOns = (addOns = []) =>
  (addOns || []).map(a => a.id).sort().join("_")

// 🔹 helper: build a unique key for a cart line
const buildCartKey = item => {
  const baseId = item.id || item.foodItem?.id || "no-id"
  const variantId = item.selectedVariant?.id || "base"
  const addOnsKey = normalizeAddOns(item.selectedAddOns)
  const note = item.specialInstructions || ""
  return `${baseId}__${variantId}__${addOnsKey}__${note}`
}

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCart(),
    isOpen: false
  },
  reducers: {
    addItem(state, action) {
      const newItem = action.payload
      const newKey = buildCartKey(newItem)

      const existing = state.items.find(
        item => buildCartKey(item) === newKey
      )

      if (existing) {
        const qtyToAdd = newItem.quantity || 1
        existing.quantity = (existing.quantity || 1) + qtyToAdd
      } else {
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1
        })
      }
    },

    removeItem(state, action) {
      state.items = state.items.filter(item => item.id !== action.payload)
    },

    updateQuantity(state, action) {
      const { id, quantity } = action.payload
      const item = state.items.find(item => item.id === id)
      if (item) {
        item.quantity = quantity < 1 ? 1 : quantity
      }
    },

    clearCart(state) {
      state.items = []
    },

    setIsOpen(state, action) {
      state.isOpen = action.payload
    }
  }
})

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setIsOpen
} = cartSlice.actions

export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    location: locationReducer,
    user: userReducer        // ⬅️ NEW
  }
})

// Persist on state change
store.subscribe(() => {
  saveCart(store.getState().cart.items)
})
