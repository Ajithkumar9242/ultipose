// src/pages/Checkout.jsx
"use client"

import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { OrderPage } from "../components/OrderPage"
import api from "../api/index"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { clearCartForStore } from "@/redux/store"

export default function Checkout() {
  const navigate = useNavigate()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const dispatch = useDispatch()

  // ✅ IMPORTANT: track placed order id
  const [placedOrderId, setPlacedOrderId] = useState(null)

  const currentStore = useSelector((state) => state.cart.currentStore)

  const cartItems = useSelector((state) =>
    currentStore ? state.cart.byStore[currentStore] || [] : []
  )

  const savedUser = useSelector((state) => {
    const byStore = state.user.byStore || {}
    return currentStore ? byStore[currentStore] || null : null
  })

  const toNumber = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // ✅ IMPORTANT: these prices are CENTS already in your UI
  // ✅ IMPORTANT: All prices in DOLLARS (same as Frappe)
const itemsPayload = useMemo(() => {
  return (cartItems || []).map((i) => {
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
      menu_item: i.foodItem?.id || i.id,
      item_name: i.foodItem?.name || i.name,
      qty,

      // ✅ DOLLARS
      unit_price,
      total_price,

      // ✅ VERY IMPORTANT: send these also
      modifiers: i.selectedModifiers || [], // [{group,id,name,price}]
      add_ons: i.selectedAddOns || [],      // optional
      variant: i.selectedVariant || null,   // optional
      note: i.specialInstructions || ""
    }
  })
}, [cartItems])


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

  const clearStoreCartPersisted = (storeCode) => {
    try {
      // 1) clear redux
      dispatch(clearCartForStore(storeCode))

      // 2) clear localStorage instantly
      const raw = localStorage.getItem("cartSlice")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.byStore?.[storeCode]) {
          parsed.byStore[storeCode] = []
        }
        localStorage.setItem("cartSlice", JSON.stringify(parsed))
      }

      // 3) remove notes
      localStorage.removeItem("itemNotes")
    } catch (e) {
      console.log("Cart clear error", e)
    }
  }

  // ---------------------- ONLINE PAYMENT ----------------------
// ---------------------- ONLINE PAYMENT (STRIPE) ----------------------
  const handleGoToPayment = async (orderDetails) => {
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

      const customerObj = {
        name: orderDetails?.userDetails?.name || savedUser?.name || "",
        phone: orderDetails?.userDetails?.phone || savedUser?.phone || "",
        email: orderDetails?.userDetails?.email || savedUser?.email || ""
      }

      if (!customerObj.phone) {
        toast.error("Phone number required")
        return
      }

      // ✅ 1) Create/update customer
      const custRes = await api.post(
        "/api/method/ultipos.api.checkout.create_or_update",
        customerObj
      )

      const customer_id = custRes?.data?.message?.customer_id
      if (!customer_id) {
        toast.error("Failed to create customer")
        return
      }

// 🎯 NEW: 2) Place the order FIRST so Stripe has an ID to attach to
      const paymentObj = {
        method: "Stripe",
        transaction_id: null
      }

      // We pack everything into ONE neat object first
      const orderPayload = {
        outlet_code: currentStore,
        customer_id: customer_id,
        customer_name: customerObj.name,
        customer_phone: customerObj.phone,
        customer_email: customerObj.email,
        delivery_address: orderDetails?.deliveryAddress || "",
        items: itemsPayload, 
        payment: paymentObj,
        coupon_code: orderDetails?.appliedCoupon?.code || null,
        order_type: orderDetails?.orderType || "Delivery",
        notes: orderDetails?.notes || null,
        platform: "Web"
      }

      // 🎯 THE FIX: We wrap the whole thing in "order_data" and stringify it, 
      // exactly how your order.py script expects to receive it!
      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        order_data: JSON.stringify(orderPayload)
      })

      const orderData = orderRes?.data?.message
      if (!orderData?.order_id) {
        toast.error("Order failed: order_id missing")
        return
      }

      // 🎯 NEW: 3) Ask backend for the Stripe Checkout URL
      const stripeRes = await api.post("/api/method/ultipos.api.stripe_pay.create_checkout_session", {
        order_id: orderData.order_id
      })

      const stripeData = stripeRes?.data?.message
      
      if (stripeData?.success && stripeData?.redirect_url) {
        // Clear the cart because they are leaving our site to pay
        clearStoreCartPersisted(currentStore)
        
        // 🚀 4) SEND THEM TO STRIPE!
        window.location.href = stripeData.redirect_url
      } else {
        toast.error("Failed to initialize payment gateway.")
      }

    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || "Checkout failed")
    } finally {
      setIsPlacingOrder(false)
    }
  }


  // ---------------------- Pay at counter ----------------------
  const handleGoToCOD = async (orderDetails) => {
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

      const customerObj = {
        name: orderDetails?.userDetails?.name || savedUser?.name || "",
        phone: orderDetails?.userDetails?.phone || savedUser?.phone || "",
        email: orderDetails?.userDetails?.email || savedUser?.email || ""
      }

      if (!customerObj.phone) {
        toast.error("Phone number required")
        return
      }

      // ✅ create/update customer
      const custRes = await api.post(
        "/api/method/ultipos.api.checkout.create_or_update",
        customerObj
      )

      const customer_id = custRes?.data?.message?.customer_id
      if (!customer_id) {
        toast.error("Failed to create customer")
        return
      }

      // ✅ place COD order
      const paymentObj = {
        method: "COD",
        transaction_id: null
      }

      // 🎯 THE FIX: Pack it all into one object first
      const orderPayload = {
        outlet_code: currentStore,
        customer_id: customer_id,
        customer_name: customerObj.name,
        customer_phone: customerObj.phone,
        customer_email: customerObj.email,
        delivery_address: orderDetails?.deliveryAddress || "",
        items: itemsPayload,
        payment: paymentObj,
        coupon_code: orderDetails?.appliedCoupon?.code || null,
        order_type: orderDetails?.orderType || "Delivery",
        notes: orderDetails?.notes || null,
        platform: "Web"
      }

      // 🎯 Wrap it in "order_data" and stringify, just like the Stripe fix!
      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        order_data: JSON.stringify(orderPayload)
      })

      const orderData = orderRes?.data?.message
      if (!orderData?.order_id) {
        toast.error("Order failed: order_id missing")
        return
      }

      toast.success("Order placed (COD) ✅")

      // ✅ IMPORTANT: mark placed order id (prevents auto redirect)
      setPlacedOrderId(orderData.order_id)

      clearStoreCartPersisted(currentStore)

      // ✅ go to order status
      navigate(`/order-status/${orderData.order_id}`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || "COD Failed")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // ✅ FIXED: don't redirect to home if order already placed
  if ((!cartItems || cartItems.length === 0) && !isPlacingOrder && !placedOrderId) {
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
      onPlaceOrderCOD={handleGoToCOD}
      placingOrder={isPlacingOrder}
      total={getCartTotal()}
      storeCode={currentStore}
    />
  )
}
