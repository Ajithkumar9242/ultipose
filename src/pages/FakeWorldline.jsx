"use client"

import { useEffect, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

export default function FakeWorldline() {
  const [q] = useSearchParams()
  const navigate = useNavigate()

  const orderId = q.get("orderId")
  const amount = q.get("amount") // ✅ expected in cents, ex: 120 = $1.20

  // ✅ Convert cents -> dollars (or just show as 0.00 if missing)
  const { amountCents, amountDisplay } = useMemo(() => {
    const cents = Number(amount || 0)
    const safeCents = Number.isFinite(cents) ? cents : 0
    return {
      amountCents: safeCents,
      amountDisplay: (safeCents / 100).toFixed(2)
    }
  }, [amount])

  useEffect(() => {
    if (!orderId) {
      navigate("/")
    }
  }, [orderId, navigate])

  if (!orderId) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 space-y-4 border">
        <div className="flex items-center gap-2 font-bold text-lg">
          <CreditCard className="w-5 h-5 text-orange-500" />
          Worldline Secure Payment (DEMO) ✅
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            Order: <b>{orderId}</b>
          </p>

          <p className="text-sm text-gray-600">
            Amount:{" "}
            <b className="text-gray-900">
              ${amountDisplay}
            </b>{" "}
            <span className="text-xs text-gray-400">(cents: {amountCents})</span>
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={() => navigate(`/payment-return?orderId=${orderId}`)}
          >
            Pay Now ✅
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/payment-return?orderId=${orderId}&failed=1`)}
          >
            Cancel ❌
          </Button>
        </div>

        <p className="text-[11px] text-gray-400 pt-2 text-center">
          DEMO payment gateway screen only.
        </p>
      </div>
    </div>
  )
}
