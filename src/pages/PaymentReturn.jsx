// src/pages/PaymentReturn.jsx
"use client"

import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { clearCart } from "@/redux/store"   // ⬅️ you already have this

export default function PaymentReturn() {
  const [q] = useSearchParams()
  const navigate = useNavigate()
  const orderId = q.get("orderId")

  const dispatch = useDispatch()
  const currentStore = useSelector(state => state.cart.currentStore)

  useEffect(() => {
    if (!orderId) return

    // 🧹 Clear cart for this store once we know payment has returned
    // clearCart in your project was already written to clear only currentStore.
    dispatch(clearCart())

    const t = setTimeout(() => {
      navigate(`/order-status/${orderId}`)
    }, 900)

    return () => clearTimeout(t)
  }, [orderId, navigate, dispatch, currentStore])

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Missing order information
          </h1>
          <p className="text-sm text-gray-600">
            We couldn&apos;t find an orderId in the payment return URL.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-50">
          <CheckCircle2 className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Returning from secure payment
        </h1>
        <p className="text-sm text-gray-600">
          We&apos;re fetching your order status from the restaurant.
          You&apos;ll be redirected automatically.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading order #{orderId}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/order-status/${orderId}`)}
        >
          View order status now
        </Button>
      </div>
    </div>
  )
}
