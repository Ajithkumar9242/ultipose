// src/pages/Checkout.jsx
"use client"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { OrderPage } from "../components/OrderPage"
import { OrderConfirmation } from "../components/OrderConfirmation"
import { clearCart } from "../redux/store"
import { toast } from "react-hot-toast"

export default function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  // 🔹 Get currentStore + cart items for that store
  const { cartItems, currentStore } = useSelector(state => {
    const storeCode = state.cart.currentStore
    const itemsForStore = storeCode
      ? state.cart.byStore[storeCode] || []
      : []
    return {
      cartItems: itemsForStore,
      currentStore: storeCode
    }
  })

  const savedUser = useSelector(state => state.user.details)

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
    // Go back to the respective store page if we know it
    if (currentStore) {
      navigate(`/store/${currentStore}`)
    } else {
      navigate(-1)
    }
  }

  const handlePlaceOrder = orderDetails => {
    const completeOrderDetails = {
      ...orderDetails,
      orderTime: new Date().toLocaleString(),
      status: "confirmed"
    }
    setOrderConfirmation(completeOrderDetails)
    dispatch(clearCart())  // clears cart for currentStore only
    toast.success(`Order placed successfully! ID: ${orderDetails.orderId}`)
    localStorage.removeItem("preparationInstructions")
  }

  // 🔹 If no items and no confirmed order → redirect back to store/home
  if ((!cartItems || cartItems.length === 0) && !orderConfirmation) {
    if (currentStore) {
      navigate(`/store/${currentStore}`)
    } else {
      navigate("/")
    }
    return null
  }

  if (orderConfirmation) {
    return (
      <OrderConfirmation
        orderDetails={orderConfirmation}
        onBackToHome={() => navigate("/")}
      />
    )
  }

  return (
    <OrderPage
      cartItems={cartItems}
      userDetails={savedUser}
      onBack={handleBack}
      onPlaceOrder={handlePlaceOrder}
      total={getCartTotal()}
    />
  )
}
