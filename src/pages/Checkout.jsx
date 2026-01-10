// src/pages/Checkout.jsx
"use client"

import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { OrderPage } from "../components/OrderPage"
import api from "../api/index"
import { toast } from "react-hot-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const { cartItems, currentStore, savedUser } = useSelector(state => {
    const storeCode = state.cart.currentStore
    const itemsForStore = storeCode ? state.cart.byStore[storeCode] || [] : []

    const byStore = state.user.byStore || {}
    const userForStore = storeCode ? byStore[storeCode] || null : null

    return {
      cartItems: itemsForStore,
      currentStore: storeCode,
      savedUser: userForStore
    }
  })

  // ✅ items payload for backend
// ✅ helper: force cents
const toCents = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : 0
}

const itemsPayload = useMemo(() => {
  return (cartItems || []).map(i => {
    const qty = i.quantity || 1

    // ✅ all cents
    const basePrice = toCents(i.selectedVariant?.price || i.price || 0)

    const addonsPrice = (i.selectedAddOns || []).reduce(
      (s, a) => s + toCents(a.price),
      0
    )

    const modsPrice = (i.selectedModifiers || []).reduce(
      (s, m) => s + toCents(m.price),
      0
    )

    const unit_price = basePrice + addonsPrice + modsPrice
    const total_price = unit_price * qty

    return {
      menu_item: i.itemId || i.foodItem?.id || i.id,
      name: i.foodItem?.name || i.name || "Item",
      item_name: i.foodItem?.name || i.name || "Item",

      // ✅ send qty and cents
      qty,
      unit_price,
      total_price
    }
  })
}, [cartItems])


  const getCartTotal = () =>
    (cartItems || []).reduce((total, item) => {
      const basePrice = item.selectedVariant?.price || item.price || 0
      const addOnsPrice = (item.selectedAddOns || []).reduce(
        (sum, addon) => sum + (Number(addon.price) || 0),
        0
      )
      const modifiersPrice = (item.selectedModifiers || []).reduce(
        (sum, mod) => sum + (Number(mod.price) || 0),
        0
      )
      return total + (basePrice + addOnsPrice + modifiersPrice) * (item.quantity || 1)
    }, 0)

  const handleBack = () => {
    if (currentStore) navigate(`/s/${currentStore}`)
    else navigate(-1)
  }

  const handleGoToPayment = async orderDetails => {
    if (!orderDetails?.items?.length) {
      toast.error("Your cart is empty")
      return
    }

    if (!currentStore) {
      toast.error("Missing store information")
      return
    }

    try {
      setIsPlacingOrder(true)

      // 1) create customer
      const custRes = await api.post("/api/method/ultipos.api.checkout.create_or_update", {
        phone: orderDetails.userDetails?.phone || "",
        name: orderDetails.userDetails?.name || "",
        email: orderDetails.userDetails?.email || ""
      })

      const customer_id = custRes?.data?.message?.customer_id
      if (!customer_id) {
        toast.error("Failed to create customer")
        return
      }

      // 2) place order
   const orderRes = await api.post("/api/method/ultipos.api.order.place", {
  outlet_code: currentStore,
  customer_id,
  items: itemsPayload,

  // ✅ THIS is the real dynamic final amount (CENTS)
  total: orderDetails.total,

  payment: {
    method: orderDetails.paymentMethod === "online" ? "Online" : "Cash",
    transaction_id: "TX-" + Date.now()
  }
})


      const orderData = orderRes?.data?.message
      console.log("ORDER PLACE RESPONSE:", orderData)

      if (!orderData?.order_id) {
        toast.error("Order failed. order_id missing.")
        return
      }

      // ✅ ONLINE → redirect to payment page
      if (orderDetails.paymentMethod === "online") {
        if (orderData?.payment_url) {
          window.location.assign(orderData.payment_url)
          return
        }
        toast.error("payment_url missing")
        return
      }

      // ✅ CASH → directly go to status
      navigate(`/order-status/${orderData.order_id}`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Checkout failed")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // ✅ if cart empty
  if (!cartItems || cartItems.length === 0) {
    if (currentStore) navigate(`/s/${currentStore}`)
    else navigate("/")
    return null
  }

  return (
    <OrderPage
      cartItems={cartItems}
      userDetails={savedUser}
      onBack={handleBack}
      onPlaceOrder={handleGoToPayment}
      placingOrder={isPlacingOrder}
      total={getCartTotal()}
      storeCode={currentStore}
    />
  )
}
