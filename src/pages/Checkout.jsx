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

  // ✅ fix redux warning (no selector object creation)
  const currentStore = useSelector(state => state.cart.currentStore)

  const cartItems = useSelector(state =>
    currentStore ? state.cart.byStore[currentStore] || [] : []
  )

  const savedUser = useSelector(state => {
    const byStore = state.user.byStore || {}
    return currentStore ? byStore[currentStore] || null : null
  })

  // ✅ helper
  const toNumber = v => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // ✅ items payload EXACTLY for order.py -> build_order_items()
  const itemsPayload = useMemo(() => {
    return (cartItems || []).map(i => {
      const qty = toNumber(i.quantity || 1)

      const base = toNumber(i.selectedVariant?.price ?? i.price ?? 0)

      const addons = (i.selectedAddOns || []).reduce(
        (s, a) => s + toNumber(a.price),
        0
      )

      const mods = (i.selectedModifiers || []).reduce(
        (s, m) => s + toNumber(m.price),
        0
      )

      const unit_price = base + addons + mods
      const total_price = unit_price * qty

      return {
        menu_item: i.id,
        item_name: i.name,
        qty,
        unit_price,
        total_price
      }
    })
  }, [cartItems])

  // ✅ total
  const getCartTotal = () =>
    (cartItems || []).reduce((total, item) => {
      const base = toNumber(item.selectedVariant?.price ?? item.price ?? 0)
      const addons = (item.selectedAddOns || []).reduce(
        (s, a) => s + toNumber(a.price),
        0
      )
      const mods = (item.selectedModifiers || []).reduce(
        (s, m) => s + toNumber(m.price),
        0
      )
      return total + (base + addons + mods) * toNumber(item.quantity || 1)
    }, 0)

  const handleBack = () => {
    if (currentStore) navigate(`/s/${currentStore}`)
    else navigate(-1)
  }

  const handleGoToPayment = async orderDetails => {
    if (!itemsPayload.length) {
      toast.error("Your cart is empty")
      return
    }

    if (!currentStore) {
      toast.error("Missing store information")
      return
    }

    try {
      setIsPlacingOrder(true)

      // ✅ customer object (used ONLY for create_or_update)
      const customerObj = {
        name: orderDetails?.userDetails?.name || savedUser?.name || "",
        phone: orderDetails?.userDetails?.phone || savedUser?.phone || "",
        email: orderDetails?.userDetails?.email || savedUser?.email || ""
      }

      if (!customerObj.phone) {
        toast.error("Phone number required")
        return
      }

      // ✅ 1) create/update customer -> get customer_id
      const custRes = await api.post(
        "/api/method/ultipos.api.checkout.create_or_update",
        customerObj
      )

      const customer_id = custRes?.data?.message?.customer_id

      if (!customer_id) {
        toast.error("Failed to create customer")
        return
      }

      // ✅ 2) place order
      const paymentObj = {
        method: orderDetails?.paymentMethod === "online" ? "Online" : "Cash",
        transaction_id: "TX-" + Date.now()
      }

      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        outlet_code: currentStore,
        customer_id: customer_id,

        // ✅ MUST stringify because backend uses _loads()
        items: JSON.stringify(itemsPayload),
        payment: JSON.stringify(paymentObj),

        coupon_code: orderDetails?.coupon?.code || null,
        order_type: orderDetails?.orderType || "Delivery",
        notes: orderDetails?.notes || null
      })

      const orderData = orderRes?.data?.message
      console.log("ORDER PLACE RESPONSE:", orderData)

      if (!orderData?.order_id) {
        toast.error("Order failed: order_id missing")
        return
      }

      // ✅ online payment: create intent -> redirect
      // if (orderDetails?.paymentMethod === "online") {
      //   const payRes = await api.post("/api/method/ultipos.api.payment.create_intent", {
      //     outlet_code: currentStore,
      //     amount: toNumber(orderDetails?.total ?? getCartTotal()),
      //     order_id: orderData.order_id,
      //     customer: JSON.stringify(customerObj)
      //   })

      //   const redirect_url = payRes?.data?.message?.redirect_url

      //   if (!redirect_url) {
      //     toast.error("Payment redirect_url missing")
      //     return
      //   }

      //   window.location.assign(redirect_url)
      //   return
      // }
      if (orderDetails?.paymentMethod === "online") {
  window.location.assign(
    `/worldline-pay?amount=${toNumber(orderDetails?.total ?? getCartTotal())}&order_id=${orderData.order_id}`
  )
  return
}


      // ✅ cash -> status page
      navigate(`/order-status/${orderData.order_id}`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || "Checkout failed")
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
