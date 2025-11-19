"use client"
import { useState } from "react"
import { X, Tag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPriceAUD } from "../utils/currency"   // ⬅️ ADD THIS

export function CouponModal({
  isOpen,
  onClose,
  onApplyCoupon,
  currentTotal,    // cents
  appliedCoupon
}) {
  const [couponCode, setCouponCode] = useState("")

  // amounts here are in cents
  const availableCoupons = [
    {
      code: "SAVE10",
      title: "Save 10%",
      description: "Get 10% off on your order",
      discount: 10,
      minOrder: 2000,   // AUD 20.00
      maxDiscount: 500, // AUD 5.00
      type: "percentage"
    },
    {
      code: "FIRST20",
      title: "First Order",
      description: "20% off on your first order",
      discount: 20,
      minOrder: 1500,   // AUD 15.00
      maxDiscount: 1000, // AUD 10.00
      type: "percentage"
    },
    {
      code: "FLAT50",
      title: "Flat Discount",
      description: "Flat discount on your order",
      discount: 500,    // AUD 5.00 flat
      minOrder: 3000,   // AUD 30.00
      type: "fixed"
    },
    {
      code: "WEEKEND15",
      title: "Weekend Special",
      description: "15% off on weekend orders",
      discount: 15,
      minOrder: 2500,   // AUD 25.00
      maxDiscount: 750, // AUD 7.50
      type: "percentage"
    }
  ]

  if (!isOpen) return null

  const handleApplyCouponCode = () => {
    const coupon = availableCoupons.find(
      c => c.code === couponCode.toUpperCase()
    )
    if (coupon && currentTotal >= coupon.minOrder) {
      onApplyCoupon(coupon)
      onClose()
    } else if (coupon) {
      alert(
        `Minimum order amount is ${formatPriceAUD(coupon.minOrder)}`
      )
    } else {
      alert("Invalid coupon code")
    }
    setCouponCode("")
  }

  const calculateDiscount = coupon => {
    if (coupon.type === "fixed") {
      return coupon.discount
    } else {
      const discount = (currentTotal * coupon.discount) / 100
      return coupon.maxDiscount
        ? Math.min(discount, coupon.maxDiscount)
        : discount
    }
  }

  const isEligible = coupon => currentTotal >= coupon.minOrder

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Apply Coupon</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Manual Coupon Code Entry */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCouponCode}
                disabled={!couponCode}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Available Coupons */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Available Coupons</h3>
            {availableCoupons.map(coupon => {
              const eligible = isEligible(coupon)
              const discount = calculateDiscount(coupon)
              const isApplied = appliedCoupon?.code === coupon.code

              return (
                <div
                  key={coupon.code}
                  className={`border rounded-lg p-4 ${
                    eligible
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  } ${isApplied ? "border-green-500 bg-green-100" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">
                          {coupon.code}
                        </span>
                        {isApplied && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {coupon.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {coupon.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Min order: {formatPriceAUD(coupon.minOrder)}
                      </p>
                      {eligible && (
                        <p className="text-sm font-medium text-green-600">
                          You&apos;ll save{" "}
                          {formatPriceAUD(Math.round(discount))}
                        </p>
                      )}
                      {!eligible && (
                        <p className="text-sm text-red-500">
                          Add{" "}
                          {formatPriceAUD(
                            coupon.minOrder - currentTotal
                          )}{" "}
                          more to apply this coupon
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (eligible) {
                          onApplyCoupon(coupon)
                          onClose()
                        }
                      }}
                      disabled={!eligible || isApplied}
                      className={`${
                        eligible && !isApplied
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isApplied ? "Applied" : "Apply"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Terms */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              • Coupons are applicable on the total order value
              <br />• Only one coupon can be applied per order
              <br />• Coupons cannot be combined with other offers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
