// src/components/OrderPage.jsx
"use client"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Plus,
  Minus,
  MessageSquare,
  Receipt,
  ShoppingBag
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CouponModal } from "./CouponModal"
import { AddressModal } from "./AddressModal"
import { useSelector, useDispatch } from "react-redux"
import { setLocation } from "@/redux/locationSlice"
import { updateQuantity, removeItem } from "@/redux/store"
import { formatPriceAUD } from "../utils/currency"
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"

export function OrderPage({
  cartItems,
  userDetails,
  onBack,
  onPlaceOrder,
  onPlaceOrderCOD,
  total,
  placingOrder = false
}) {
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  const dispatch = useDispatch()

  // ✅ helper: ALWAYS treat price as cents
  const toCents = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.round(n) : 0
  }

  // 🔹 addresses local to this page
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [hasAutoOpenedAddressModal, setHasAutoOpenedAddressModal] =
    useState(false)

const navigate = useNavigate()

  // 🔥 currentStore
  const currentStore = useSelector((state) => state.cart.currentStore)

  const locationForStore = useSelector((state) => {
    const storeCode = state.cart.currentStore
    const byStore = state.location.byStore || {}
    return storeCode && byStore[storeCode]
      ? byStore[storeCode]
      : { type: "delivery", data: "" }
  })

  const effectiveUser = userDetails || {}

  // ⬇️ AUTO-OPEN ADDRESS POPUP ONCE IF NO LOCATION FOR THIS STORE
  useEffect(() => {
    if (!locationForStore?.data && !hasAutoOpenedAddressModal) {
      setIsAddressModalOpen(true)
      setHasAutoOpenedAddressModal(true)
    }
  }, [locationForStore?.data, hasAutoOpenedAddressModal])

  // Local copy of cart items
  const [items, setItems] = useState(cartItems)

  useEffect(() => {
    setItems(cartItems || [])
  }, [cartItems])

  // Notes per cartKey (NOT item.id)
  const [noteDrafts, setNoteDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem("itemNotes")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [editingNoteKey, setEditingNoteKey] = useState(null)

  // ✅ FIXED: quantity sync using cartKey
  const handleUpdateQuantity = (cartKey, newQuantity) => {
    if (!cartKey) return

    if (newQuantity < 1) {
      setItems((prev) => prev.filter((item) => item.cartKey !== cartKey))
      dispatch(removeItem(cartKey))
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item
      )
    )

    dispatch(updateQuantity({ cartKey, quantity: newQuantity }))
  }

  const handleRemoveItem = (cartKey) => {
    if (!cartKey) return
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey))
    dispatch(removeItem(cartKey))
  }

  // ✅ computedTotal in CENTS
  const computedTotal = items.reduce((sum, item) => {
    const base = toCents(item.selectedVariant?.price || item.price || 0)

    const addOns = (item.selectedAddOns || []).reduce(
      (s, a) => s + toCents(a.price),
      0
    )

    const mods = (item.selectedModifiers || []).reduce(
      (s, m) => s + toCents(m.price),
      0
    )

    return sum + (base + addOns + mods) * (item.quantity || 1)
  }, 0)

  const handleApplyCoupon = (coupon) => {
    if (!coupon) return
    setAppliedCoupon(coupon)
    setIsCouponModalOpen(false)
  }

  const calculateDiscount = (coupon) => {
    if (!coupon) return 0

    let rawDiscount = 0

    if (coupon.type === "fixed") {
      rawDiscount = toCents(coupon.discount || 0)
    } else {
      const percent = Number(coupon.discount || 0)
      rawDiscount = Math.round((computedTotal * percent) / 100)
    }

    if (coupon.maxDiscount) {
      rawDiscount = Math.min(rawDiscount, toCents(coupon.maxDiscount))
    }

    return Math.min(rawDiscount, computedTotal)
  }

  const discount = calculateDiscount(appliedCoupon)
  const finalTotal = Math.max(0, computedTotal - discount)

  // Address handlers
  const handleAddAddress = (address) => setAddresses((prev) => [...prev, address])

  const handleUpdateAddress = (updatedAddress) => {
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === updatedAddress.id ? updatedAddress : addr))
    )

    if (selectedAddress && selectedAddress.id === updatedAddress.id) {
      setSelectedAddress(updatedAddress)
    }
  }

  const handleDeleteAddress = (addressId) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
    if (selectedAddress && selectedAddress.id === addressId) {
      setSelectedAddress(null)
    }
  }

  const handleSelectAddress = (address) => {
    setSelectedAddress(address)

    if (currentStore) {
      dispatch(
        setLocation({
          storeCode: currentStore,
          type: "delivery",
          data: address.address
        })
      )
    }
  }

  const handleDetectLocationAgain = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.display_name

          if (currentStore) {
            dispatch(
              setLocation({
                storeCode: currentStore,
                type: "delivery",
                data: address
              })
            )
          }
        } catch (err) {
          console.error("Error reverse geocoding:", err)
          alert("Could not fetch address.")
        }
      },
      (error) => {
        console.log("Location denied or failed:", error)
        alert("We couldn't get your location. You can still continue.")
      }
    )
  }

  const startEditingNote = (item) => {
    const key = item.cartKey
    if (!key) return
    setEditingNoteKey(key)
    setNoteDrafts((prev) => ({
      ...prev,
      [key]: prev[key] ?? item.specialInstructions ?? ""
    }))
  }

  const saveNoteForItem = (cartKey) => {
    const text = (noteDrafts[cartKey] || "").trim()

    setItems((prev) =>
      prev.map((it) =>
        it.cartKey === cartKey ? { ...it, specialInstructions: text } : it
      )
    )

    const next = { ...noteDrafts, [cartKey]: text }
    localStorage.setItem("itemNotes", JSON.stringify(next))
    setNoteDrafts(next)
    setEditingNoteKey(null)
  }

  const cancelNoteForItem = (cartKey) => {
    setEditingNoteKey(null)
    setNoteDrafts((prev) => {
      const copy = { ...prev }
      delete copy[cartKey]
      return copy
    })
  }

  const handlePlaceOrderInternal = async () => {
    const effectiveAppliedCoupon = discount > 0 ? appliedCoupon : null

    const orderDetails = {
      items,
      userDetails: effectiveUser,
      paymentMethod: "online",
      deliveryAddress:
        locationForStore.data || selectedAddress?.address || "No address",

      subtotal: computedTotal,
      tax: 0,
      discount,
      total: finalTotal,

      appliedCoupon: effectiveAppliedCoupon,
      orderId: `MF${Date.now()}`,
      estimatedDelivery: "45-50 mins"
    }

    await onPlaceOrder(orderDetails)

    setNoteDrafts({})
    localStorage.removeItem("itemNotes")
  }

  const handlePlaceOrderCODInternal = async () => {
    const effectiveAppliedCoupon = discount > 0 ? appliedCoupon : null

    const orderDetails = {
      items,
      userDetails: effectiveUser,
      paymentMethod: "cod",
      deliveryAddress:
        locationForStore.data || selectedAddress?.address || "No address",

      subtotal: computedTotal,
      tax: 0,
      discount,
      total: finalTotal,

      appliedCoupon: effectiveAppliedCoupon,
      orderId: `MF${Date.now()}`,
      estimatedDelivery: "45-50 mins"
    }

    await onPlaceOrderCOD(orderDetails)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-orange-100 selection:text-orange-600">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-4 p-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Checkout
            </h1>
            <span className="text-xs text-gray-500 font-medium">
              {items.length} Items
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Delivery Address
                </h2>

                {!locationForStore.data && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-orange-500 hover:bg-orange-50 text-xs font-semibold"
                    onClick={handleDetectLocationAgain}
                  >
                    Detect Location
                  </Button>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1 font-medium uppercase tracking-wide">
                  Your location
                </p>
                <p className="text-gray-900 font-semibold leading-relaxed">
                  {locationForStore.data || "No location selected"}
                </p>
              </div>

              <div className="pl-2 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-orange-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-900 font-bold text-base">
                          {effectiveUser.name || "Guest user"}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          {effectiveUser.phone || "No phone added"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {effectiveUser.email}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-4 border-gray-200 text-orange-600 hover:bg-orange-50 hover:border-orange-200 font-semibold text-xs"
                        onClick={() => setIsAddressModalOpen(true)}
                      >
                        CHANGE
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Your Order
              </h2>

              <div className="space-y-8">
                {items.map((item) => {
                  const basePrice = toCents(
                    item.selectedVariant?.price || item.price || 0
                  )

                  const addOnsPrice = (item.selectedAddOns || []).reduce(
                    (sum, addon) => sum + toCents(addon.price),
                    0
                  )

                  const modsPrice = (item.selectedModifiers || []).reduce(
                    (sum, mod) => sum + toCents(mod.price),
                    0
                  )

                  const itemTotal =
                    (basePrice + addOnsPrice + modsPrice) *
                    (item.quantity || 1)

                  const noteKey = item.cartKey
                  const draftValue = noteDrafts[noteKey] ?? item.specialInstructions ?? ""

                  return (
                    <div key={item.cartKey} className="group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className={`w-5 h-5 border-2 rounded-md flex items-center justify-center mt-1 shrink-0 ${
                              item.isVeg ? "border-green-500" : "border-red-500"
                            }`}
                          >
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                item.isVeg ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">
                              {item.foodItem?.name || item.name || "Unnamed Item"}
                            </h3>

                            {/* Variants & Addons */}
                            <div className="mt-1 space-y-0.5">
                              {item.selectedVariant && (
                                <p className="text-sm text-gray-500 font-medium">
                                  {item.selectedVariant.name}
                                </p>
                              )}

                              {item.selectedAddOns &&
                                item.selectedAddOns.length > 0 && (
                                  <p className="text-xs text-gray-400">
                                    <span className="font-semibold text-gray-500">
                                      Extras:
                                    </span>{" "}
                                    {item.selectedAddOns.map((a) => a.name).join(", ")}
                                  </p>
                                )}

                              {(item.selectedModifiers || []).length > 0 && (
                                <p className="text-xs text-gray-400">
                                  <span className="font-semibold text-gray-500">
                                    Custom:
                                  </span>{" "}
                                  {(item.selectedModifiers || [])
                                    .map((m) => `${m.group}: ${m.name}`)
                                    .join(", ")}
                                </p>
                              )}
                            </div>

                            {/* Saved Note Display */}
                            {item.specialInstructions &&
                              editingNoteKey !== item.cartKey && (
                                <div className="mt-2 text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg inline-block border border-orange-100">
                                  <span className="font-bold">Note:</span>{" "}
                                  {item.specialInstructions}
                                </div>
                              )}

                            <div className="mt-2 text-base font-bold text-gray-900">
                              {formatPriceAUD(itemTotal)}
                            </div>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.cartKey, (item.quantity || 1) - 1)
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-sm hover:scale-110 transition-transform active:scale-95"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="w-8 text-center text-sm font-bold text-gray-800">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.cartKey, (item.quantity || 1) + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-green-600 shadow-sm hover:scale-110 transition-transform active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.cartKey)}
                            className="text-xs text-red-400 hover:text-red-600 underline decoration-red-200 hover:decoration-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="mt-3 pl-9">
                        {editingNoteKey !== item.cartKey ? (
                          <button
                            onClick={() => startEditingNote(item)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {item.specialInstructions
                              ? "Edit instructions"
                              : "Add cooking instructions"}
                          </button>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Instructions for kitchen
                            </div>

                            <Input
                              placeholder="e.g., less spicy, extra sauce..."
                              value={draftValue}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [noteKey]: e.target.value
                                }))
                              }
                              className="text-sm border-gray-200 focus-visible:ring-orange-500 bg-white"
                            />

                            <div className="flex gap-2 mt-3 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelNoteForItem(item.cartKey)}
                                className="text-gray-500 hover:text-gray-800"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveNoteForItem(item.cartKey)}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm"
                              >
                                Save Note
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 border-b border-gray-50"></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Coupon card */}
           
              <div
  onClick={() => setIsCouponModalOpen(true)}
  className="bg-gradient-to-r from-orange-50 to-white rounded-2xl p-4 border border-orange-100 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
>
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-orange-100 group-hover:scale-110 transition-transform">
                      <span className="text-orange-500 font-bold text-lg">%</span>
                    </div>

                    <div>
                      <span className="block font-bold text-gray-800">
                        Available Offers
                      </span>
                      <span className="text-xs text-gray-500">Tap to view coupons</span>
                    </div>
                  </div>

                  <span className="text-orange-400 group-hover:translate-x-1 transition-transform">
                    ›
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        APPLIED
                      </div>
                      <p className="text-sm font-bold text-gray-700 tracking-wide">
                        {appliedCoupon.code}
                      </p>
                    </div>

                    <p className="text-xs font-semibold text-green-600">
                      You saved {formatPriceAUD(discount)}
                    </p>
                  </div>
                )}
              </div>
          

            {/* Bill Summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gray-400" />
                Bill Details
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Item Total</span>
                  <span className="font-semibold text-gray-900">
                    {formatPriceAUD(computedTotal)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      Discount{" "}
                      <span className="text-[10px] bg-green-200 px-1 rounded text-green-800">
                        {appliedCoupon?.code}
                      </span>
                    </span>
                    <span className="font-bold">-{formatPriceAUD(discount)}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 my-4"></div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-gray-500 text-xs font-medium">
                      To Pay
                    </span>
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">
                      {formatPriceAUD(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Make Payment */}
              <div className="mt-8">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePlaceOrderInternal()
                  }}
                  disabled={placingOrder || items.length === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 text-lg font-bold rounded-xl shadow-lg shadow-orange-200 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {placingOrder ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <div className="flex items-center justify-between w-full px-2">
                      <span>Make Payment</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                        {formatPriceAUD(finalTotal)}
                      </span>
                    </div>
                  )}
                </Button>

                <p className="text-center text-[10px] text-gray-400 mt-3">
                  By proceeding, you agree to our Terms & Conditions
                </p>
              </div>

              {/* COD */}
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePlaceOrderCODInternal()
                  }}
                  disabled={placingOrder || items.length === 0}
                  className="w-full bg-gray-900 hover:bg-black text-white py-6 text-lg font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-70"
                >
                  Cash on Delivery
                </Button>
              </div>
            </div>
            <Button onClick={() => navigate("/order-history")}>
  My Orders
</Button>

          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        onSelectAddress={handleSelectAddress}
        onAddAddress={handleAddAddress}
        onUpdateAddress={handleUpdateAddress}
        onDeleteAddress={handleDeleteAddress}
        selectedAddressId={selectedAddress?.id || null}
        defaultName={effectiveUser.name || ""}
      />

      {/* Coupon Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onApplyCoupon={handleApplyCoupon}
        currentTotal={computedTotal} // cents
        appliedCoupon={appliedCoupon}
        storeCode={currentStore}
      />
    </div>
  )
}
