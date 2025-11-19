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
  const cartItems = useSelector(state => state.cart.items)
  const savedUser = useSelector(state => state.user.details)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  const getCartTotal = () =>
    cartItems.reduce((total, item) => {
      const basePrice = item.selectedVariant?.price || item.price
      const addOnsPrice = (item.selectedAddOns || []).reduce(
        (sum, addon) => sum + addon.price,
        0
      )
      return total + (basePrice + addOnsPrice) * (item.quantity || 1)
    }, 0)

  const handleBack = () => {
    navigate(-1) // goes back to store page
  }

  const handlePlaceOrder = orderDetails => {
    const completeOrderDetails = {
      ...orderDetails,
      orderTime: new Date().toLocaleString(),
      status: "confirmed"
    }
    setOrderConfirmation(completeOrderDetails)
    dispatch(clearCart())
    toast.success(`Order placed successfully! ID: ${orderDetails.orderId}`)
    localStorage.removeItem("preparationInstructions")
  }

  if (!cartItems.length && !orderConfirmation) {
    // no items -> go back to store/home
    navigate("/")
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
