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
  X,
  Receipt,
  UtensilsCrossed,
  ShoppingBag
} from "lucide-react" // Added a few icons if available, otherwise code ignores them. 
// Note: Kept original imports below strict.
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CouponModal } from "./CouponModal"
import { AddressModal } from "./AddressModal"
import { useSelector, useDispatch } from "react-redux"
import { setLocation } from "@/redux/locationSlice"
import { updateQuantity, removeItem } from "@/redux/store"
import { formatPriceAUD } from "../utils/currency"
import { toast } from "react-hot-toast"

export function OrderPage({
  cartItems,
  userDetails,   // ✅ store-specific user
  onBack,
  onPlaceOrder,
  total,
  placingOrder = false      // 🔥 NEW: from Checkout
}) {
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  const dispatch = useDispatch()

  // 🔹 addresses local to this page
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [hasAutoOpenedAddressModal, setHasAutoOpenedAddressModal] =
    useState(false)

  // 🔥 get currentStore + location FOR THAT STORE
  const { currentStore, locationForStore } = useSelector(state => {
    const storeCode = state.cart.currentStore
    const byStore = state.location.byStore || {}
    const loc =
      storeCode && byStore[storeCode]
        ? byStore[storeCode]
        : { type: "delivery", data: "" }

    return {
      currentStore: storeCode,
      locationForStore: loc
    }
  })

  // ✅ per-store user
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

  // Notes per item
  const [noteDrafts, setNoteDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem("itemNotes")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [editingNoteId, setEditingNoteId] = useState(null)

  // 🔹 quantity sync
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      setItems(prevItems => prevItems.filter(item => item.id !== itemId))
      dispatch(removeItem(itemId))
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )

    dispatch(updateQuantity({ id: itemId, quantity: newQuantity }))
  }

  const handleRemoveItem = itemId => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
    dispatch(removeItem(itemId))
  }

  const computedTotal = items.reduce((sum, item) => {
    const base = item.selectedVariant?.price || item.price || 0
    const addOns = (item.selectedAddOns || []).reduce(
      (s, a) => s + a.price,
      0
    )
    return sum + (base + addOns) * (item.quantity || 1)
  }, 0)

  // 🔹 Right now backend owns the real tax calculation (single `tax` field).
  // On checkout UI we just show item total & discount; final tax comes from API.
  const tax = 0

  const cgst = Math.round(computedTotal * 0.025)
  const sgst = Math.round(computedTotal * 0.025)

  // 🔹 Reusable discount calculator for any coupon object
  const calculateDiscount = coupon => {
    if (!coupon) return 0

    // 🚫 MAIN RULE: if cart total is $10 or below (1000 cents), NO discount
    if (computedTotal <= 1000) {
      return 0
    }

    let rawDiscount = 0

    if (coupon.type === "fixed") {
      // e.g. 1000 = $10 OFF
      rawDiscount = coupon.discount || 0
    } else {
      const percent = coupon.discount || 0
      rawDiscount = (computedTotal * percent) / 100
    }

    if (coupon.maxDiscount) {
      rawDiscount = Math.min(rawDiscount, coupon.maxDiscount)
    }

    return Math.min(rawDiscount, computedTotal)
  }

  const discount = calculateDiscount(appliedCoupon)

  // clamp at 0 so we never show negative amounts
  const finalTotal = Math.max(0, computedTotal - discount)

  // 🔹 Address handlers
  const handleAddAddress = address => {
    setAddresses(prev => [...prev, address])
    // ❌ no auto-select; user must tap address card to select
  }

  const handleUpdateAddress = updatedAddress => {
    setAddresses(prev =>
      prev.map(addr => (addr.id === updatedAddress.id ? updatedAddress : addr))
    )

    if (selectedAddress && selectedAddress.id === updatedAddress.id) {
      setSelectedAddress(updatedAddress)
    }
  }

  const handleDeleteAddress = addressId => {
    setAddresses(prev => {
      const filtered = prev.filter(addr => addr.id !== addressId)
      return filtered
    })

    if (selectedAddress && selectedAddress.id === addressId) {
      // ❌ don't pick random one; just clear selection
      setSelectedAddress(null)
    }
  }

  const handleSelectAddress = address => {
    setSelectedAddress(address)

    // keep Redux location in sync PER STORE
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

  const handleApplyCoupon = coupon => {
    if (!coupon) return

    // 🚫 Rule 1: minimum cart value
    if (computedTotal <= 1000) {
      toast.error("This offer is valid only for orders above $10.")
      return
    }

    const potentialDiscount = calculateDiscount(coupon)

    // no real benefit or negative case
    if (potentialDiscount <= 0) {
      toast.error("This offer can't be applied to the current cart.")
      return
    }

    // 🚫 safety: discount should never exceed cart total (extra guard)
    if (potentialDiscount > computedTotal) {
      toast.error("This offer can't be applied for this cart value.")
      return
    }

    // ✅ safe to apply
    setAppliedCoupon(coupon)
    setIsCouponModalOpen(false)
  }

  const handleDetectLocationAgain = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
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
      error => {
        console.log("Location denied or failed:", error)
        alert("We couldn't get your location. You can still continue.")
      }
    )
  }

  const handlePlaceOrderInternal = () => {
    // ❗ only keep coupon if it actually gives a discount
    const effectiveAppliedCoupon = discount > 0 ? appliedCoupon : null

    const orderDetails = {
      items,
      userDetails: effectiveUser,
      deliveryAddress:
        locationForStore.data || selectedAddress?.address || "No address",
      subtotal: computedTotal,
      tax,                  // currently 0; real tax comes from backend
      discount,
      total: finalTotal,
      appliedCoupon: effectiveAppliedCoupon,
      orderId: `MF${Date.now()}`,
      estimatedDelivery: "45-50 mins"
    }

    onPlaceOrder(orderDetails)

    setNoteDrafts({})
    localStorage.removeItem("itemNotes")
  }

  const startEditingNote = item => {
    setEditingNoteId(item.id)
    setNoteDrafts(prev => ({
      ...prev,
      [item.id]: prev[item.id] ?? item.specialInstructions ?? ""
    }))
  }

  const saveNoteForItem = itemId => {
    const text = (noteDrafts[itemId] || "").trim()

    setItems(prev =>
      prev.map(it =>
        it.id === itemId ? { ...it, specialInstructions: text } : it
      )
    )

    const nextNotes = {
      ...noteDrafts,
      [itemId]: text
    }
    localStorage.setItem("itemNotes", JSON.stringify(nextNotes))
    setNoteDrafts(nextNotes)
    setEditingNoteId(null)
  }

  const cancelNoteForItem = itemId => {
    setEditingNoteId(null)
    setNoteDrafts(prev => {
      const copy = { ...prev }
      delete copy[itemId]
      return copy
    })
  }

  useEffect(() => {
    if (appliedCoupon && computedTotal <= 1000) {
      setAppliedCoupon(null)
      toast("Coupon removed: minimum order value is above $10.")
    }
  }, [computedTotal, appliedCoupon])

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-orange-100 selection:text-orange-600">
      {/* 🔹 Modern Glassmorphism Header */}
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
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Checkout</h1>
            <span className="text-xs text-gray-500 font-medium">{items.length} Items</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 🔹 Delivery Details Card */}
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
                <p className="text-sm text-gray-500 mb-1 font-medium uppercase tracking-wide">Your location</p>
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

            {/* 🔹 Items in Cart */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Your Order
              </h2>
              
              <div className="space-y-8">
                {items.map(item => {
                  const basePrice = item.selectedVariant?.price || item.price || 0
                  const addOnsPrice = (item.selectedAddOns || []).reduce(
                    (sum, addon) => sum + addon.price,
                    0
                  )
                  const itemTotal = (basePrice + addOnsPrice) * item.quantity

                  const draftValue =
                    noteDrafts[item.id] ??
                    item.specialInstructions ??
                    ""

                  return (
                    <div key={item.id} className="group">
                      <div className="flex items-start justify-between gap-4">
                        
                        {/* Veg/Non-Veg Indicator + Item Info */}
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
                              {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                <p className="text-xs text-gray-400">
                                  <span className="font-semibold text-gray-500">Extras:</span> {item.selectedAddOns.map(a => a.name).join(", ")}
                                </p>
                              )}
                            </div>
                            
                            {/* Saved Note Display */}
                            {item.specialInstructions && editingNoteId !== item.id && (
                                <div className="mt-2 text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg inline-block border border-orange-100">
                                  <span className="font-bold">Note:</span> {item.specialInstructions}
                                </div>
                            )}

                            {/* Price */}
                            <div className="mt-2 text-base font-bold text-gray-900">
                              {formatPriceAUD(itemTotal)}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls - Pill Shape */}
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                                <button
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-sm hover:scale-110 transition-transform active:scale-95"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold text-gray-800">
                                    {item.quantity}
                                </span>
                                <button
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-green-600 shadow-sm hover:scale-110 transition-transform active:scale-95"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                            
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-xs text-red-400 hover:text-red-600 underline decoration-red-200 hover:decoration-red-500 transition-colors"
                            >
                              Remove
                            </button>
                        </div>
                      </div>

                      {/* Instructions Input Area */}
                      <div className="mt-3 pl-9">
                        {editingNoteId !== item.id ? (
                          <button
                            onClick={() => startEditingNote(item)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {item.specialInstructions ? "Edit instructions" : "Add cooking instructions"}
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
                              onChange={e =>
                                setNoteDrafts(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))
                              }
                              className="text-sm border-gray-200 focus-visible:ring-orange-500 bg-white"
                            />
                            <div className="flex gap-2 mt-3 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelNoteForItem(item.id)}
                                className="text-gray-500 hover:text-gray-800"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveNoteForItem(item.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm"
                              >
                                Save Note
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Item Separator (except last) */}
                      <div className="mt-6 border-b border-gray-50"></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Bill Details */}
          <div className="space-y-6">
            
            {/* 🔹 Coupon / Offers Card */}
            {computedTotal > 1000 && (
              <div 
                onClick={() => setIsCouponModalOpen(true)}
                className="bg-gradient-to-r from-orange-50 to-white rounded-2xl p-4 border border-orange-100 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-orange-100 group-hover:scale-110 transition-transform">
                       {/* Percent Icon */}
                       <span className="text-orange-500 font-bold text-lg">%</span>
                    </div>
                    <div>
                        <span className="block font-bold text-gray-800">Available Offers</span>
                        <span className="text-xs text-gray-500">Tap to view coupons</span>
                    </div>
                  </div>
                  <span className="text-orange-400 group-hover:translate-x-1 transition-transform">›</span>
                </div>

                {appliedCoupon && (
                  <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">APPLIED</div>
                         <p className="text-sm font-bold text-gray-700 tracking-wide">
                          {appliedCoupon.code}
                        </p>
                    </div>
                    <p className="text-xs font-semibold text-green-600">
                      You saved {formatPriceAUD(Math.round(discount))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 🔹 Bill Summary Card */}
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

                {/* Tax Placeholder */}
                {/* <div className="flex justify-between items-center text-gray-600">
                  <span>Taxes & Charges</span>
                  <span className="font-semibold text-gray-900">{formatPriceAUD(tax)}</span>
                </div> */}

                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1">
                        Discount <span className="text-[10px] bg-green-200 px-1 rounded text-green-800">{appliedCoupon?.code}</span>
                    </span>
                    <span className="font-bold">
                      -{formatPriceAUD(Math.round(discount))}
                    </span>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 my-4"></div>

                <div className="flex justify-between items-end">
                  <div>
                      <span className="block text-gray-500 text-xs font-medium">To Pay</span>
                      <span className="text-2xl font-bold text-gray-900 tracking-tight">{formatPriceAUD(Math.round(finalTotal))}</span>
                  </div>
                </div>
              </div>

              {/* 🔹 Make Payment Button */}
              <div className="mt-8">
                <Button
                    onClick={handlePlaceOrderInternal}
                    disabled={placingOrder || items.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 text-lg font-bold rounded-xl shadow-lg shadow-orange-200 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {placingOrder ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            Processing...
                        </span>
                    ) : (
                        <div className="flex items-center justify-between w-full px-2">
                            <span>Make Payment</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{formatPriceAUD(Math.round(finalTotal))}</span>
                        </div>
                    )}
                </Button>
                <p className="text-center text-[10px] text-gray-400 mt-3">
                    By proceeding, you agree to our Terms & Conditions
                </p>
              </div>
            </div>

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
        defaultName={effectiveUser.name || ""}  // 🔥 prefill name
      />

      {/* Coupon Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onApplyCoupon={handleApplyCoupon}       // 🔥 use validator
        currentTotal={computedTotal}
        appliedCoupon={appliedCoupon}
        storeCode={currentStore}
      />

    </div>
  )
}