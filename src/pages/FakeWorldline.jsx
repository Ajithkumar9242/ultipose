"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import api from "@/api"
import { toast } from "react-hot-toast"

export default function FakeWorldline() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const amount = params.get("amount")
  const orderId = params.get("order_id")

  const [seconds, setSeconds] = useState(5)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (seconds <= 0) {
      if (orderId) navigate(`/order-status/${orderId}`)
      else navigate("/")
    }
  }, [seconds, orderId, navigate])

  const handlePayNow = async () => {
    if (!orderId) {
      toast.error("Missing order id")
      return navigate("/")
    }

    try {
      setPaying(true)

      // ✅ mark paid in backend
      await api.post("/api/method/ultipos.api.payment_status.mark_paid", {
        order_id: orderId
      })

      toast.success("Payment successful ✅")
      navigate(`/order-status/${orderId}`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Worldline Payment (Mock)</h1>

        <p className="text-gray-600 text-sm mb-3">
          Amount: <b>{amount}</b>
        </p>

        <p className="text-gray-600 text-sm mb-5">
          Order ID: <b>{orderId || "missing"}</b>
        </p>

        <Button
          className="bg-green-600 hover:bg-green-700 text-white w-full"
          onClick={handlePayNow}
          disabled={paying}
        >
          {paying ? "Processing..." : "Pay Now (Success)"}
        </Button>

        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={() => navigate("/")}
          disabled={paying}
        >
          Cancel Payment
        </Button>

        <p className="text-xs text-gray-500 mt-4">
          Auto redirect in {seconds}s...
        </p>
      </div>
    </div>
  )
}
