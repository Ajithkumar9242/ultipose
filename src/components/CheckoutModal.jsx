"use client"
import { useState } from "react"
import { X, MapPin, CreditCard, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPriceAUD } from "../utils/currency"   // ⬅️ ADD THIS

export function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  total,          // total in cents
  onPlaceOrder
}) {
  const [step, setStep] = useState(1) // 1: Address, 2: Payment, 3: Confirmation
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    address: "",
    landmark: "",
    city: "Bangalore",
    pincode: ""
  })
  const [paymentMethod, setPaymentMethod] = useState("online")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  // values in cents (400 = AUD 4.00)
  const deliveryFee = 400
  const taxes = Math.round(total * 0.05) // 5% tax on subtotal (still cents)
  const finalTotal = total + deliveryFee + taxes

  const handlePlaceOrder = async () => {
    setIsProcessing(true)

    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const orderDetails = {
      items: cartItems,
      address,
      paymentMethod,
      subtotal: total,
      deliveryFee,
      taxes,
      total: finalTotal,
      orderId: `MF${Date.now()}`,
      estimatedDelivery: "45-50 mins"
    }

    onPlaceOrder(orderDetails)
    setIsProcessing(false)
    setStep(3)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === 1
              ? "Delivery Address"
              : step === 2
              ? "Payment"
              : "Order Confirmed"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Enter your delivery address</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Full Name"
                  value={address.name}
                  onChange={e =>
                    setAddress({ ...address, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Phone Number"
                  value={address.phone}
                  onChange={e =>
                    setAddress({ ...address, phone: e.target.value })
                  }
                />
              </div>

              <Input
                placeholder="Complete Address"
                value={address.address}
                onChange={e =>
                  setAddress({ ...address, address: e.target.value })
                }
              />

              <Input
                placeholder="Landmark (Optional)"
                value={address.landmark}
                onChange={e =>
                  setAddress({ ...address, landmark: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={address.city}
                  onChange={e =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
                <Input
                  placeholder="Pincode"
                  value={address.pincode}
                  onChange={e =>
                    setAddress({ ...address, pincode: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={
                  !address.name ||
                  !address.phone ||
                  !address.address ||
                  !address.pincode
                }
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>{formatPriceAUD(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatPriceAUD(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Charges</span>
                    <span>{formatPriceAUD(taxes)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPriceAUD(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="font-semibold mb-3">Choose Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={e => setPaymentMethod(e.target.value)}
                    />
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span>Online Payment (Card/Wallet)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={e => setPaymentMethod(e.target.value)}
                    />
                    <Banknote className="w-5 h-5 text-green-500" />
                    <span>Cash on Delivery</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isProcessing
                    ? "Processing..."
                    : `Place Order - ${formatPriceAUD(finalTotal)}`}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                Order Placed Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                Your order will be delivered in 45-50 minutes
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="font-medium">Order ID: MF{Date.now()}</p>
                <p className="text-sm text-gray-600">
                  Track your order in the Orders section
                </p>
              </div>
              <Button
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
