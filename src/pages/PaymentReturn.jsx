// src/pages/PaymentReturn.jsx
"use client"

import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDispatch } from "react-redux"
import { toast } from "react-hot-toast"

import { clearCartForStore, clearCart } from "@/redux/store"

export default function PaymentReturn() {
  const [q] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const orderId = q.get("orderId")
  const failed = q.get("failed")
  const storeCode = q.get("storeCode") // ✅ pass storeCode in fakeworldline redirect

  useEffect(() => {
    if (!orderId) return

    // ❌ cancelled
    if (failed) {
      toast.error("Payment cancelled ❌")
      navigate(`/order-status/${orderId}`)
      return
    }

    // ✅ success
    toast.success("Payment success ✅")

    // ✅ clear cart
    if (storeCode) dispatch(clearCartForStore(storeCode))
    else dispatch(clearCart())

    // ✅ go to status
    const t = setTimeout(() => {
      navigate(`/order-status/${orderId}`)
    }, 600)

    return () => clearTimeout(t)
  }, [orderId, failed, storeCode, dispatch, navigate])

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Missing order</h1>
          <p className="text-sm text-gray-600">orderId missing in URL.</p>
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
          Confirming payment & loading order status...
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
