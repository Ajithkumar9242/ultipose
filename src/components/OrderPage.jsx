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
  X
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
    tax,                 // currently 0; real tax comes from backend
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Your location:</p>
                  <p className="text-gray-900 font-medium">
                    {locationForStore.data || "No location selected"}
                  </p>

                  {!locationForStore.data && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-orange-500 border-orange-500 bg-transparent"
                      onClick={handleDetectLocationAgain}
                    >
                      Detect current location
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Pickup from:</p>
                  <p className="text-gray-900 font-medium">
                    NO 90/3 4th floor Marathahalli - Sarjapur Outer Ring R...
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-gray-900 font-semibold">
                      {effectiveUser.name || "Guest user"}
                    </p>
                    <p className="text-sm text-gray-900">
                      {effectiveUser.phone || "No phone added"}
                    </p>
                    <p className="text-sm text-gray-700">
                      {effectiveUser.email || "No email added"}
                    </p>
                    <p className="text-xs text-gray-500">
                      (We'll send order updates on this number/email.)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-500 border-orange-500 bg-transparent"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  CHANGE
                </Button>
              </div>
            </div>

            {/* Items in Cart */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Items in cart</h2>
              <div className="space-y-4">
                {items.map(item => {
                  const basePrice =
                    item.selectedVariant?.price || item.price || 0
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
                    <div key={item.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`w-4 h-4 border-2 flex items-center justify-center mt-1 ${
                              item.isVeg ? "border-green-500" : "border-red-500"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.isVeg ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {item.foodItem?.name ||
                                item.name ||
                                "Unnamed Item"}
                            </h3>

                            {item.selectedVariant && (
                              <p className="text-sm text-gray-600">
                                {item.selectedVariant.name}
                              </p>
                            )}
                            {item.selectedAddOns &&
                              item.selectedAddOns.length > 0 && (
                                <p className="text-sm text-gray-600">
                                  Add-ons:{" "}
                                  {item.selectedAddOns
                                    .map(a => a.name)
                                    .join(", ")}
                                </p>
                              )}

                            {item.specialInstructions && (
                              <p className="text-sm text-gray-500 italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}

                            <p className="text-sm font-medium text-gray-900">
                              {formatPriceAUD(itemTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-8 h-8 p-0 text-orange-500 border-orange-500"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>

                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 p-0 text-orange-500 border-orange-500"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-8 h-8 p-0 rounded-full text-red-500 border-red-500"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Per-item Preparation Instructions */}
                      <div className="ml-7">
                        {editingNoteId !== item.id ? (
                          <button
                            onClick={() => startEditingNote(item)}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {item.specialInstructions
                              ? "Edit preparation instructions"
                              : "Preparation Instructions +"}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <MessageSquare className="w-4 h-4" />
                              Preparation Instructions (for this item)
                            </div>
                            <Input
                              placeholder="e.g., less spicy, extra sauce, no onions"
                              value={draftValue}
                              onChange={e =>
                                setNoteDrafts(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))
                              }
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveNoteForItem(item.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelNoteForItem(item.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Bill Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Bill details</h2>
                            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Total</span>
                  <span className="font-medium">
                    {formatPriceAUD(computedTotal)}
                  </span>
                </div>

                {/* If in future you get a `tax` preview from API, plug it here */}
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    {formatPriceAUD(tax)}
                  </span>
                </div> */}

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>
                      -{formatPriceAUD(Math.round(discount))}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>To Pay</span>
                  <span>{formatPriceAUD(Math.round(finalTotal))}</span>
                </div>
              </div>

            </div>

            {/* Apply Store Offer */}
            {/* Apply Store Offer – only show above $10 */}
{computedTotal > 1000 && (
  <div className="bg-white rounded-lg p-4">
    <button
      onClick={() => setIsCouponModalOpen(true)}
      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">
            %
          </span>
        </div>
        <span className="font-medium text-green-600">
          Apply Store offer
        </span>
      </div>
      <span className="text-green-600 text-xl">›</span>
    </button>
    {appliedCoupon && (
      <div className="mt-3 p-3 bg-green-50 rounded-lg">
        <p className="text-sm font-medium text-green-700">
          {appliedCoupon.code} Applied
        </p>
        <p className="text-xs text-green-600">
          You saved {formatPriceAUD(Math.round(discount))}!
        </p>
      </div>
    )}
  </div>
)}


            {/* Make Payment Button */}
            <Button
          onClick={handlePlaceOrderInternal}
          disabled={placingOrder || items.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {placingOrder ? "PROCESSING..." : "MAKE PAYMENT"}
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
        defaultName={effectiveUser.name || ""}  // 🔥 prefill name
      />

      {/* Coupon Modal */}
      <CouponModal
  isOpen={isCouponModalOpen}
  onClose={() => setIsCouponModalOpen(false)}
  onApplyCoupon={handleApplyCoupon}      // 🔥 use validator
  currentTotal={computedTotal}
  appliedCoupon={appliedCoupon}
  storeCode={currentStore}
/>

    </div>
  )
}
