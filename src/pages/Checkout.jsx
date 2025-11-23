// src/pages/Checkout.jsx
"use client"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { OrderPage } from "../components/OrderPage"
import api from "../api/index"          // ⬅️ same style as company repo
import { toast } from "react-hot-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // 🔹 Get currentStore + cart items + user FOR THAT STORE (same as before)
  const { cartItems, currentStore, savedUser } = useSelector(state => {
    const storeCode = state.cart.currentStore
    const itemsForStore = storeCode
      ? state.cart.byStore[storeCode] || []
      : []

    const byStore = state.user.byStore || {}
    const userForStore = storeCode ? byStore[storeCode] || null : null

    return {
      cartItems: itemsForStore,
      currentStore: storeCode,
      savedUser: userForStore
    }
  })

  // 🔸 Build items payload in the *same shape* as company checkout
  const itemsPayload = useMemo(
    () =>
      (cartItems || []).map(i => ({
        // Try to be flexible with ids, so it works with your current cart shape
        itemId: i.itemId || i.foodItem?.id || i.id,
        quantity: i.quantity || 1,
        modifierOptionIds: (
          i.selectedAddOns ||          // our newer add-ons
          i.modifiers || []           // older company-style modifiers (if present)
        ).map(m => m._id || m.id)
      })),
    [cartItems]
  )

  const getCartTotal = () =>
    (cartItems || []).reduce((total, item) => {
      const basePrice = item.selectedVariant?.price || item.price
      const addOnsPrice = (item.selectedAddOns || []).reduce(
        (sum, addon) => sum + addon.price,
        0
      )
      return total + (basePrice + addOnsPrice) * (item.quantity || 1)
    }, 0)

  const handleBack = () => {
    if (currentStore) {
      navigate(`/s/${currentStore}`)
    } else {
      navigate(-1)
    }
  }

  // 🔥 Secure checkout – similar logic to company Checkout.jsx.placeOrder
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

      const customer = {
        name: orderDetails.userDetails?.name || "",
        phone: orderDetails.userDetails?.phone || "",
        email: orderDetails.userDetails?.email || "",
        address: orderDetails.deliveryAddress || ""
      }

      const payload = {
        customer,
        items: itemsPayload,
        // Later we can add UI toggle for PICKUP/DELIVERY – for now, use DELIVERY
        fulfillment: { type: "DELIVERY" },
        coupon: orderDetails.appliedCoupon?.code || undefined
      }

      // 🔒 Hit secure backend checkout endpoint (same as company)
      const res = await api.post(
        `/ultipos-online/${currentStore}/checkout`,
        payload
      )

      const body = res.data || res
      const payment = body.payment || {}
      const orderId =
        body.orderId || (body.data && body.data.orderId) || null

      if (payment.redirectUrl) {
        // Hosted payment page (Worldline)
        window.location.assign(payment.redirectUrl)
      } else if (orderId) {
        // No hosted payment, but order created – go to status page
        navigate(`/order-status/${orderId}`)
      } else {
        toast.error("Unexpected checkout response")
      }
    } catch (err) {
      console.error("checkout error", err)
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Checkout failed"
      toast.error(msg)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // If cart is empty, push user back like before
  if (!cartItems || cartItems.length === 0) {
    if (currentStore) {
      navigate(`/s/${currentStore}`)
    } else {
      navigate("/")
    }
    return null
  }

  return (
    <OrderPage
      cartItems={cartItems}
      userDetails={savedUser}    // ✅ per-store user
      onBack={handleBack}
      onPlaceOrder={handleGoToPayment}   // 🔥 now calls secure backend
      placingOrder={isPlacingOrder}      // ⬅️ to disable button while loading
      total={getCartTotal()}
    />
  )
}
