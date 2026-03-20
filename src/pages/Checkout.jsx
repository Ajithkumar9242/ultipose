// src/pages/Checkout.jsx
"use client"

import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
import { OrderPage } from "../components/OrderPage"
import api from "../api/index"
import { toast } from "react-hot-toast"
import { clearCartForStore } from "@/redux/store"

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState(null)
  
  // 🎯 NEW: State to hold the dynamic payment buttons
  const [availableGateways, setAvailableGateways] = useState([])

  const currentStore = useSelector((state) => state.cart.currentStore)
  const cartItems = useSelector((state) => currentStore ? state.cart.byStore[currentStore] || [] : [])
  const savedUser = useSelector((state) => {
    const byStore = state.user.byStore || {}
    return currentStore ? byStore[currentStore] || null : null
  })

  const toNumber = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // 🎯 NEW: Fetch which gateways the owner turned on!
  useEffect(() => {
    if (currentStore) {
      api.get(`/api/method/ultipos.api.payment_gateways.get_active_gateways?outlet_code=${currentStore}`)
        .then(res => {
          if (res.data && res.data.message) {
            setAvailableGateways(res.data.message)
          }
        })
        .catch(err => console.error("Failed to fetch gateways", err))
    }
  }, [currentStore])

  const itemsPayload = useMemo(() => {
    return (cartItems || []).map((i) => {
      const qty = toNumber(i.quantity || 1)
      const base = toNumber(i.selectedVariant?.price ?? i.price ?? 0)
      const addons = (i.selectedAddOns || []).reduce((s, a) => s + toNumber(a.price), 0)
      const mods = (i.selectedModifiers || []).reduce((s, m) => s + toNumber(m.price), 0)
      const unit_price = base + addons + mods
      const total_price = unit_price * qty

      return {
        menu_item: i.foodItem?.id || i.id,
        item_name: i.foodItem?.name || i.name,
        qty,
        unit_price,
        total_price,
        modifiers: i.selectedModifiers || [], 
        add_ons: i.selectedAddOns || [],      
        variant: i.selectedVariant || null,   
        note: i.specialInstructions || ""
      }
    })
  }, [cartItems])

  const getCartTotal = () =>
    (cartItems || []).reduce((total, item) => {
      const base = toNumber(item.selectedVariant?.price ?? item.price ?? 0)
      const addons = (item.selectedAddOns || []).reduce((s, a) => s + toNumber(a.price), 0)
      const mods = (item.selectedModifiers || []).reduce((s, m) => s + toNumber(m.price), 0)
      return total + (base + addons + mods) * toNumber(item.quantity || 1)
    }, 0)

  const handleBack = () => {
    if (currentStore) navigate(`/s/${currentStore}`)
    else navigate(-1)
  }

  const clearStoreCartPersisted = (storeCode) => {
    try {
      dispatch(clearCartForStore(storeCode))
      const raw = localStorage.getItem("cartSlice")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.byStore?.[storeCode]) parsed.byStore[storeCode] = []
        localStorage.setItem("cartSlice", JSON.stringify(parsed))
      }
      localStorage.removeItem("itemNotes")
    } catch (e) {
      console.log("Cart clear error", e)
    }
  }

  // ---------------------- ONLINE PAYMENT ----------------------
  const handleGoToPayment = async (orderDetails, gatewayType) => {
    if (!itemsPayload.length) return toast.error("Your cart is empty")
    if (!currentStore) return toast.error("Missing store information")

    try {
      setIsPlacingOrder(true)

      const customerObj = {
        name: orderDetails?.userDetails?.name || savedUser?.name || "",
        phone: orderDetails?.userDetails?.phone || savedUser?.phone || "",
        email: orderDetails?.userDetails?.email || savedUser?.email || ""
      }

      if (!customerObj.phone) return toast.error("Phone number required")

      const custRes = await api.post("/api/method/ultipos.api.checkout.create_or_update", customerObj)
      const customer_id = custRes?.data?.message?.customer_id
      if (!customer_id) return toast.error("Failed to create customer")

      const paymentObj = { method: gatewayType, transaction_id: null }

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

      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        order_data: JSON.stringify(orderPayload)
      })

      const orderData = orderRes?.data?.message
      if (!orderData?.order_id) return toast.error("Order failed: order_id missing")

      // 🎯 THE FIX: Pass the specific gateway chosen by the user!
      const gatewayRes = await api.post("/api/method/ultipos.api.payment_gateways.create_checkout_session", {
        order_id: orderData.order_id,
        gateway: gatewayType 
      })

      const paymentData = gatewayRes?.data?.message
      
      if (paymentData?.success && paymentData?.redirect_url) {
        clearStoreCartPersisted(currentStore)
        window.location.href = paymentData.redirect_url
      } else {
        toast.error(`Failed to initialize ${gatewayType}.`)
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
    // ... (Your COD logic remains exactly the same, no changes needed here) ...
    if (!itemsPayload.length) return toast.error("Your cart is empty")
    if (!currentStore) return toast.error("Missing store information")

    try {
      setIsPlacingOrder(true)

      const customerObj = {
        name: orderDetails?.userDetails?.name || savedUser?.name || "",
        phone: orderDetails?.userDetails?.phone || savedUser?.phone || "",
        email: orderDetails?.userDetails?.email || savedUser?.email || ""
      }

      if (!customerObj.phone) return toast.error("Phone number required")

      const custRes = await api.post("/api/method/ultipos.api.checkout.create_or_update", customerObj)
      const customer_id = custRes?.data?.message?.customer_id
      if (!customer_id) return toast.error("Failed to create customer")

      const paymentObj = { method: "COD", transaction_id: null }

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

      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        order_data: JSON.stringify(orderPayload)
      })

      const orderData = orderRes?.data?.message
      if (!orderData?.order_id) return toast.error("Order failed: order_id missing")

      toast.success("Order placed (COD) ✅")
      setPlacedOrderId(orderData.order_id)
      clearStoreCartPersisted(currentStore)
      navigate(`/order-status/${orderData.order_id}`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || "COD Failed")
    } finally {
      setIsPlacingOrder(false)
    }
  }

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
      availableGateways={availableGateways} // 🎯 NEW PROPS PASSED HERE!
    />
  )
}