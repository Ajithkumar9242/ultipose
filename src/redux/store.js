// src/redux/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit"
import locationReducer from "./locationSlice"
import userReducer from "./userSlice"

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

// 🔹 Load full cart slice (all stores) from localStorage
const loadCartState = () => {
  try {
    const serialized = localStorage.getItem("cartSlice")
    if (!serialized) {
      return {
        byStore: {},
        currentStore: null,
        isOpen: false
      }
    }
    const parsed = JSON.parse(serialized)
    return {
      byStore: parsed.byStore || {},
      currentStore: parsed.currentStore || null,
      isOpen: !!parsed.isOpen
    }
  } catch (e) {
    return {
      byStore: {},
      currentStore: null,
      isOpen: false
    }
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState: loadCartState(),
  reducers: {
    // 🔹 Set which store we are currently on
    setCurrentStore(state, action) {
      const storeCode = action.payload
      state.currentStore = storeCode
      if (!state.byStore[storeCode]) {
        state.byStore[storeCode] = []
      }
    },

    addItem(state, action) {
      const storeCode = state.currentStore
      if (!storeCode) return

      const items = state.byStore[storeCode] || (state.byStore[storeCode] = [])
      const newItem = action.payload
      const newKey = buildCartKey(newItem)

      const existing = items.find(item => buildCartKey(item) === newKey)

      if (existing) {
        const qtyToAdd = newItem.quantity || 1
        existing.quantity = (existing.quantity || 1) + qtyToAdd
      } else {
        items.push({
          ...newItem,
          quantity: newItem.quantity || 1
        })
      }
    },

    removeItem(state, action) {
      const storeCode = state.currentStore
      if (!storeCode) return

      const items = state.byStore[storeCode] || []
      state.byStore[storeCode] = items.filter(
        item => item.id !== action.payload
      )
    },

    updateQuantity(state, action) {
      const storeCode = state.currentStore
      if (!storeCode) return

      const { id, quantity } = action.payload
      const items = state.byStore[storeCode] || []
      const item = items.find(item => item.id === id)
      if (item) {
        item.quantity = quantity < 1 ? 1 : quantity
      }
    },

    clearCart(state) {
      const storeCode = state.currentStore
      if (!storeCode) return
      state.byStore[storeCode] = []
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
  setIsOpen,
  setCurrentStore
} = cartSlice.actions

export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    location: locationReducer,
    user: userReducer
  }
})

// 🔹 Persist the *entire* cart slice (all stores) on every state change
store.subscribe(() => {
  try {
    const cartState = store.getState().cart
    localStorage.setItem("cartSlice", JSON.stringify(cartState))
  } catch (e) {
    // ignore write errors
  }
})
