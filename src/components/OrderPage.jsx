// src/components/OrderPage.jsx
"use client"
import { useState } from "react"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Plus,
  Minus,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CouponModal } from "./CouponModal"
import { AddressModal } from "./AddressModal"
import { useSelector, useDispatch } from "react-redux"
import { setLocation } from "@/redux/locationSlice"
import { formatPriceAUD } from "../utils/currency" // AUD formatter

export function OrderPage({
  cartItems,
  userDetails, // comes from AuthModal
  onBack,
  onPlaceOrder,
  total
}) {
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  const dispatch = useDispatch()

  const [addresses, setAddresses] = useState([
    {
      id: "1",
      type: "home",
      name: "John Doe",
      address: "Cluster_dodda Nekkundi 2 Benoxa Tower, SHRADDHA...",
      landmark: "Near Metro Station",
      city: "Bangalore",
      pincode: "560037",
      isDefault: true
    }
  ])
  const [selectedAddress, setSelectedAddress] = useState(addresses[0])
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const location = useSelector(state => state.location)
  const savedUser = useSelector(state => state.user.details)

  // Prefer local userDetails (from this session), fallback to Redux
  const effectiveUser = userDetails || savedUser || {}

  // Local copy of cart items (so we can change qty / notes)
  const [items, setItems] = useState(cartItems)

  // Per-item note drafts (id -> string), persisted in localStorage
  const [noteDrafts, setNoteDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem("itemNotes")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  // Which item currently has the note input open
  const [editingNoteId, setEditingNoteId] = useState(null)

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return // prevent 0 quantity

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const computedTotal = items.reduce((sum, item) => {
    const base = item.selectedVariant?.price || item.price || 0
    const addOns = (item.selectedAddOns || []).reduce(
      (s, a) => s + a.price,
      0
    )
    return sum + (base + addOns) * (item.quantity || 1)
  }, 0)

  const cgst = Math.round(computedTotal * 0.025)
  const sgst = Math.round(computedTotal * 0.025)

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.type === "fixed") {
      return appliedCoupon.discount
    } else {
      const discount = (computedTotal * appliedCoupon.discount) / 100
      return appliedCoupon.maxDiscount
        ? Math.min(discount, appliedCoupon.maxDiscount)
        : discount
    }
  }

  const discount = calculateDiscount()
  const finalTotal = computedTotal + cgst + sgst - discount

  const handleAddAddress = address => {
    setAddresses([...addresses, address])
  }

  const handleUpdateAddress = updatedAddress => {
    setAddresses(
      addresses.map(addr =>
        addr.id === updatedAddress.id ? updatedAddress : addr
      )
    )
    if (selectedAddress.id === updatedAddress.id) {
      setSelectedAddress(updatedAddress)
    }
  }

  const handleDeleteAddress = addressId => {
    setAddresses(addresses.filter(addr => addr.id !== addressId))
  }

  const handleSelectAddress = address => {
    setSelectedAddress(address)

    // keep Redux location in sync
    dispatch(
      setLocation({
        type: "delivery",
        data: address.address
      })
    )
  }

  // Ask for location again on payment page (when user clicks button)
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

          dispatch(
            setLocation({
              type: "delivery",
              data: address
            })
          )
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

  // Place order – uses per-item specialInstructions
  const handlePlaceOrderInternal = () => {
    const orderDetails = {
      items,
      userDetails: effectiveUser,
      deliveryAddress:
        location.data || selectedAddress?.address || "No address",
      subtotal: computedTotal,
      cgst,
      sgst,
      discount,
      total: finalTotal,
      appliedCoupon,
      orderId: `MF${Date.now()}`,
      estimatedDelivery: "45-50 mins"
    }
    onPlaceOrder(orderDetails)

    // Clear saved notes after order
    setNoteDrafts({})
    localStorage.removeItem("itemNotes")
  }

  // Start editing note for one item
  const startEditingNote = item => {
    setEditingNoteId(item.id)
    setNoteDrafts(prev => ({
      ...prev,
      [item.id]:
        prev[item.id] ??
        item.specialInstructions ??
        ""
    }))
  }

  // Save note for one item
  const saveNoteForItem = itemId => {
    const text = (noteDrafts[itemId] || "").trim()

    // update in local items state
    setItems(prev =>
      prev.map(it =>
        it.id === itemId ? { ...it, specialInstructions: text } : it
      )
    )

    // persist to localStorage
    const nextNotes = {
      ...noteDrafts,
      [itemId]: text
    }
    localStorage.setItem("itemNotes", JSON.stringify(nextNotes))
    setNoteDrafts(nextNotes)
    setEditingNoteId(null)
  }

  // Cancel editing for one item
  const cancelNoteForItem = itemId => {
    setEditingNoteId(null)
    setNoteDrafts(prev => {
      const copy = { ...prev }
      delete copy[itemId]
      return copy
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">My Order</h1>
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
                    {location.data || "No location selected"}
                  </p>

                  {!location.data && (
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
                    <p className="text-gray-900 font-medium">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-medium">
                    {formatPriceAUD(cgst)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-medium">
                    {formatPriceAUD(sgst)}
                  </span>
                </div>
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

            {/* Make Payment Button */}
            <Button
              onClick={handlePlaceOrderInternal}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-medium rounded-lg"
            >
              MAKE PAYMENT
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
        selectedAddressId={selectedAddress.id}
      />

      {/* Coupon Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onApplyCoupon={coupon => {
          setAppliedCoupon(coupon)
          setIsCouponModalOpen(false)
        }}
        currentTotal={computedTotal}
        appliedCoupon={appliedCoupon}
      />
    </div>
  )
}
