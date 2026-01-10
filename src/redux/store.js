  // src/redux/store.js
  import { configureStore, createSlice } from "@reduxjs/toolkit"
  import locationReducer from "./locationSlice"
  import userReducer from "./userSlice"

  // 🔹 helper: normalize add-ons array (order doesn’t matter)
  const normalizeAddOns = (addOns = []) =>
    (addOns || []).map(a => a.id).sort().join("_")

  // 🔹 helper: normalize ids array
  const normalizeIds = (arr = []) =>
    (arr || [])
      .map(x => x?.id)
      .filter(Boolean)
      .sort()
      .join("_")

  // ✅ normalize modifiers selection [{group,id,name,price}]
  const normalizeModifiers = (mods = []) =>
    (mods || [])
      .map(m => `${m.group}:${m.id}`)
      .filter(Boolean)
      .sort()
      .join("_")

  // 🔹 helper: build a unique key for a cart line
  const buildCartKey = item => {
    const baseId = item.id || item.foodItem?.id || "no-id"
    const variantId = item.selectedVariant?.id || "base"

    const addOnsKey = normalizeIds(item.selectedAddOns)

    const modifiersKey = normalizeModifiers(item.selectedModifiers)

    const note = (item.specialInstructions || "").trim()

    return `${baseId}__v:${variantId}__a:${addOnsKey}__m:${modifiersKey}__n:${note}`
  }


  // 🔹 helper: build a unique key for a cart line
  // const buildCartKey = item => {
  //   const baseId = item.id || item.foodItem?.id || "no-id"
  //   const variantId = item.selectedVariant?.id || "base"
  //   const addOnsKey = normalizeAddOns(item.selectedAddOns)
  //   const note = item.specialInstructions || ""
  //   return `${baseId}__${variantId}__${addOnsKey}__${note}`
  // }

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

    const cartKey = buildCartKey(newItem)

    const existing = items.find(item => item.cartKey === cartKey)

    if (existing) {
      const qtyToAdd = newItem.quantity || 1
      existing.quantity = (existing.quantity || 1) + qtyToAdd
    } else {
      items.push({
        ...newItem,
        cartKey,
        quantity: newItem.quantity || 1,
        selectedAddOns: newItem.selectedAddOns || [],
        selectedModifiers: newItem.selectedModifiers || []
      })
    }
  },


    removeItem(state, action) {
    const storeCode = state.currentStore
    if (!storeCode) return

    const cartKey = action.payload
    const items = state.byStore[storeCode] || []

    state.byStore[storeCode] = items.filter(item => item.cartKey !== cartKey)
  },

  updateQuantity(state, action) {
    const storeCode = state.currentStore
    if (!storeCode) return

    const { cartKey, quantity } = action.payload

    const items = state.byStore[storeCode] || []
    const item = items.find(item => item.cartKey === cartKey)

    if (item) {
      item.quantity = quantity < 1 ? 1 : quantity
    }
  },

      // 🔹 clears cart for *current* store (used in PaymentReturn)
clearCart(state) {
  state.byStore = {}
  state.currentStore = null
}
,


      // 🔹 NEW: clear cart for a specific storeCode (used in OrderStatus)
      clearCartForStore(state, action) {
        const storeCode = action.payload
        if (!storeCode) return
        if (!state.byStore) return
        if (state.byStore[storeCode]) {
          state.byStore[storeCode] = []
        }
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
    clearCartForStore,   // ⬅️ export this
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

  // persist cartSlice as before
  store.subscribe(() => {
    try {
      const cartState = store.getState().cart
      localStorage.setItem("cartSlice", JSON.stringify(cartState))
    } catch (e) {
      // ignore write errors
    }
  })
