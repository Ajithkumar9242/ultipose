// src/components/CouponModal.jsx
"use client"
import { useState, useEffect } from "react"
import { X, Tag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPriceAUD } from "../utils/currency"
import api from "@/api"
import CouponAnimation from "./CouponAnimation"

// 🔹 Map backend promotion -> frontend coupon object
const mapPromotionToCoupon = promo => {
  const isPercent = promo.type === "PERCENT"

  return {
    code: promo.code,                               // e.g. "FLAT10"
    title: promo.name || promo.code,               // e.g. "FLAT 10"
    description: promo.description || "",
    type: isPercent ? "percentage" : "fixed",      // matches existing logic
    discount: isPercent ? promo.value : promo.valueCents, // % or cents
    minOrder: promo.minSpendCents || 0,            // in cents
    maxDiscount: promo.maxDiscountCents ?? null,   // in cents or null
    displayValue: promo.displayValue || null       // e.g. "10%"
  }
}

export function CouponModal({
  isOpen,
  onClose,
  onApplyCoupon,
  currentTotal,   // cents
  appliedCoupon,
  storeCode       // which store's coupons to load
}) {
  const [couponCode, setCouponCode] = useState("")
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 🔹 Fetch coupons when modal opens & storeCode is known
  useEffect(() => {
    if (!isOpen || !storeCode) return

    let cancelled = false

const fetchCoupons = async () => {
  setLoading(true)
  setError(null)

  try {
    const res = await api.get("/api/method/ultipos.api.coupon.get_active", {
      params: { outlet_code: storeCode }
    })

    const coupons = res?.data?.message || []

    const mapped = coupons.map(c => ({
      code: c.coupon_code,
      title: c.coupon_code,
      description: "",
      type: c.discount_type === "Percentage" ? "percentage" : "fixed",
      discount: Number(c.discount_value || 0),
      minOrder: Number(c.min_order_amount || 0),
      maxDiscount: c.max_discount ? Number(c.max_discount) : null
    }))

    if (!cancelled) {
      setAvailableCoupons(mapped)
    }
  } catch (err) {
    console.error("Failed to load coupons", err)
    if (!cancelled) {
      setError("Failed to load coupons")
      setAvailableCoupons([])
    }
  } finally {
    if (!cancelled) setLoading(false)
  }
}


    fetchCoupons()

    return () => {
      cancelled = true
    }
  }, [isOpen, storeCode])

  // Clear code when closing modal
  useEffect(() => {
    if (!isOpen) {
      setCouponCode("")
    }
  }, [isOpen])

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
      // cents
      return coupon.discount
    } else {
      // percentage
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
        disabled={loading}              // 🔒 prevent typing while loading (optional)
      />
      <Button
        onClick={handleApplyCouponCode}
        disabled={!couponCode || loading}  // 🔒 disable apply while loading
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Apply
      </Button>
    </div>
  </div>

  {/* 🔥 IF LOADING → show animated coupon loader & skip the rest */}
  {loading ? (
    <CouponAnimation />
  ) : (
    <>
      {/* Error state */}
      {error && (
        <p className="text-sm text-red-500 mb-3">
          {error}
        </p>
      )}

      {/* Available Coupons */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Available Coupons</h3>

        {!loading && availableCoupons.length === 0 && !error && (
          <p className="text-sm text-gray-500">
            No offers available for this store right now.
          </p>
        )}

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

                    {coupon.displayValue && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {coupon.displayValue}
                      </span>
                    )}

                    {isApplied && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>

                  <h4 className="font-medium text-gray-900 mb-1">
                    {coupon.title}
                  </h4>

                  {coupon.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      {coupon.description}
                    </p>
                  )}

                  {coupon.minOrder > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      Min order: {formatPriceAUD(coupon.minOrder)}
                    </p>
                  )}

                  {eligible && (
                    <p className="text-sm font-medium text-green-600">
                      You&apos;ll save{" "}
                      {formatPriceAUD(Math.round(discount))}
                    </p>
                  )}

                  {!eligible && coupon.minOrder > 0 && (
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
    </>
  )}
</div>

      </div>
    </div>
  )
}
