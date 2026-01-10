import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  items: JSON.parse(localStorage.getItem("cart") || "[]")
}

// ✅ helper to build a unique key per customization
const buildCartKey = (payload) => {
  const variantId = payload?.selectedVariant?.id || ""

  const addOns = (payload?.selectedAddOns || [])
    .map(a => a.id)
    .sort()
    .join(",")

  const modifiers = (payload?.selectedModifiers || [])
    .map(m => `${m.group}:${m.id}`)
    .sort()
    .join(",")

  return `${payload.id}__v:${variantId}__a:${addOns}__m:${modifiers}`
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const cartKey = buildCartKey(action.payload)

      const index = state.items.findIndex(i => i.cartKey === cartKey)

      if (index >= 0) {
        state.items[index].quantity += 1
      } else {
        state.items.push({
          ...action.payload,
          cartKey,
          quantity: 1
        })
      }

      localStorage.setItem("cart", JSON.stringify(state.items))
    },

    increaseQuantity: (state, action) => {
      const item = state.items.find(i => i.cartKey === action.payload)
      if (item) item.quantity += 1
      localStorage.setItem("cart", JSON.stringify(state.items))
    },

    decreaseQuantity: (state, action) => {
      const item = state.items.find(i => i.cartKey === action.payload)
      if (item) {
        item.quantity -= 1
        if (item.quantity <= 0) {
          state.items = state.items.filter(i => i.cartKey !== action.payload)
        }
      }
      localStorage.setItem("cart", JSON.stringify(state.items))
    },

    clearCart: state => {
      state.items = []
      localStorage.setItem("cart", JSON.stringify(state.items))
    }
  }
})

export const { addToCart, increaseQuantity, decreaseQuantity, clearCart } =
  cartSlice.actions

export default cartSlice.reducer
