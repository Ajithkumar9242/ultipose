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
        unit_price,   // cents
        total_price   // cents
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

      // ✅ 1) create/update customer
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
        method: "Online",
        transaction_id: "TX-" + Date.now()
      }

      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        outlet_code: currentStore,
        customer_id,

        customer_name: customerObj.name,
        customer_phone: customerObj.phone,
        customer_email: customerObj.email,
        delivery_address: orderDetails?.deliveryAddress || "",

        items: JSON.stringify(itemsPayload),
        payment: JSON.stringify(paymentObj),

        coupon_code: orderDetails?.appliedCoupon?.code || null,
        order_type: orderDetails?.orderType || "Delivery",
        notes: orderDetails?.notes || null
      })

      const orderData = orderRes?.data?.message
      if (!orderData?.order_id) {
        toast.error("Order failed: order_id missing")
        return
      }

      // ✅ IMPORTANT: mark placed order id (prevents auto redirect to home)
      setPlacedOrderId(orderData.order_id)

      // ✅ Clear cart safely
      clearStoreCartPersisted(currentStore)

      // ✅ 3) Create payment intent
      const amount = toNumber(orderDetails?.total ?? getCartTotal()) // cents

      const payRes = await api.post(
        "/api/method/ultipos.api.payment.create_intent",
        {
          outlet_code: currentStore,
          amount,
          order_id: orderData.order_id,
          customer: JSON.stringify(customerObj)
        }
      )

      const redirect_url = payRes?.data?.message?.redirect_url

      if (!redirect_url) {
        toast.error("Payment redirect_url missing")
        // if payment intent fails, go to order status anyway
        navigate(`/order-status/${orderData.order_id}`)
        return
      }

      // ✅ redirect to gateway
      window.location.href = redirect_url
      return
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || "Checkout failed")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // ---------------------- CASH ON DELIVERY ----------------------
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

      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        outlet_code: currentStore,
        customer_id,

        customer_name: customerObj.name,
        customer_phone: customerObj.phone,
        customer_email: customerObj.email,
        delivery_address: orderDetails?.deliveryAddress || "",

        items: JSON.stringify(itemsPayload),
        payment: JSON.stringify(paymentObj),

        coupon_code: orderDetails?.appliedCoupon?.code || null,
        order_type: orderDetails?.orderType || "Delivery",
        notes: orderDetails?.notes || null
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
