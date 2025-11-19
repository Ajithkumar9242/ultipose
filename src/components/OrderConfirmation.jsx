"use client"
import { useState, useEffect } from "react"
import {
  Check,
  Clock,
  MapPin,
  Phone,
  Truck,
  ChefHat,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function OrderConfirmation({ orderDetails, onBackToHome }) {
  const [currentStatus, setCurrentStatus] = useState("confirmed")
  const [estimatedTime, setEstimatedTime] = useState(45)

  useEffect(() => {
    // Simulate order status progression
    const statusProgression = [
      { status: "confirmed", delay: 0 },
      { status: "preparing", delay: 5000 },
      { status: "on_the_way", delay: 25000 },
      { status: "delivered", delay: 45000 }
    ]

    statusProgression.forEach(({ status, delay }) => {
      setTimeout(() => {
        setCurrentStatus(status)
        if (status === "preparing") setEstimatedTime(40)
        if (status === "on_the_way") setEstimatedTime(15)
        if (status === "delivered") setEstimatedTime(0)
      }, delay)
    })
  }, [])

  const getStatusIcon = status => {
    switch (status) {
      case "confirmed":
        return <Check className="w-5 h-5" />
      case "preparing":
        return <ChefHat className="w-5 h-5" />
      case "on_the_way":
        return <Truck className="w-5 h-5" />
      case "delivered":
        return <Package className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusText = status => {
    switch (status) {
      case "confirmed":
        return "Order Confirmed"
      case "preparing":
        return "Preparing your order"
      case "on_the_way":
        return "On the way"
      case "delivered":
        return "Delivered"
      default:
        return "Processing"
    }
  }

  const getStatusColor = (status, isActive) => {
    if (!isActive) return "text-gray-400"
    switch (status) {
      case "confirmed":
        return "text-green-600"
      case "preparing":
        return "text-blue-600"
      case "on_the_way":
        return "text-orange-600"
      case "delivered":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const orderStatuses = ["confirmed", "preparing", "on_the_way", "delivered"]
  const currentStatusIndex = orderStatuses.indexOf(currentStatus)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-green-500 text-white p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-green-100">Order ID: {orderDetails.orderId}</p>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Order Status Tracking */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Track your order</h2>
            {estimatedTime > 0 && (
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {estimatedTime} mins remaining
                </span>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="relative">
            <div className="flex justify-between items-center">
              {orderStatuses.map((status, index) => {
                const isActive = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex

                return (
                  <div
                    key={status}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isActive
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {getStatusIcon(status)}
                    </div>
                    <p
                      className={`text-sm mt-2 text-center ${
                        isCurrent
                          ? "font-semibold text-gray-900"
                          : isActive
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {getStatusText(status)}
                    </p>
                    {isCurrent && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1 animate-pulse"></div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
              <div
                className="h-full bg-green-500 transition-all duration-1000"
                style={{
                  width: `${(currentStatusIndex / (orderStatuses.length - 1)) *
                    100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Current Status Message */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">
              {getStatusText(currentStatus)}
            </p>
            {currentStatus === "confirmed" && (
              <p className="text-blue-600 text-sm mt-1">
                Your order has been confirmed and sent to the restaurant.
              </p>
            )}
            {currentStatus === "preparing" && (
              <p className="text-blue-600 text-sm mt-1">
                The restaurant is preparing your delicious meal.
              </p>
            )}
            {currentStatus === "on_the_way" && (
              <p className="text-blue-600 text-sm mt-1">
                Your order is on the way! The delivery partner will reach you
                soon.
              </p>
            )}
            {currentStatus === "delivered" && (
              <p className="text-blue-600 text-sm mt-1">
                Your order has been delivered! Enjoy your meal!
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="font-semibold mb-4">Order Details</h3>
            <div className="space-y-4">
              {orderDetails.items.map(item => {
                const basePrice =
                  item.selectedVariant?.price || item.price
                const addOnsPrice = item.selectedAddOns.reduce(
                  (sum, addon) => sum + addon.price,
                  0
                )
                const itemTotal = (basePrice + addOnsPrice) * item.quantity

                return (
                  <div key={item.id} className="flex items-start gap-3">
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
                      <h4 className="font-medium">
                        {item.foodItem?.name || item.name || "Unnamed Item"}
                      </h4>

                      {item.selectedVariant && (
                        <p className="text-sm text-gray-600">
                          {item.selectedVariant.name}
                        </p>
                      )}
                      {item.selectedAddOns.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Add-ons:{" "}
                          {item.selectedAddOns
                            .map(addon => addon.name)
                            .join(", ")}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-medium">₹{itemTotal}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {orderDetails.preparationInstructions && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Preparation Instructions:
                  </p>
                  <p className="text-sm text-gray-600">
                    {orderDetails.preparationInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Delivering to:</p>
                    <p className="font-medium">
                      {orderDetails.deliveryAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Contact:</p>
                    <p className="font-medium">
                      {orderDetails.userDetails.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-4">Bill Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span>₹{orderDetails.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span>₹{orderDetails.cgst}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST</span>
                  <span>₹{orderDetails.sgst}</span>
                </div>
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{orderDetails.discount}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Paid</span>
                  <span>₹{orderDetails.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onBackToHome}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Continue Shopping
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Download Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
