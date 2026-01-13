import { useSearchParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function WorldlinePay() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const order_id = params.get("order_id")
  const amount = params.get("amount")

  useEffect(() => {
    if (!order_id) navigate("/")
  }, [order_id])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-2xl shadow max-w-md w-full text-center">
        <h1 className="text-xl font-bold mb-2">ANZ Worldline Payment</h1>

        <p className="text-gray-600 text-sm mb-4">
          Order: <b>{order_id}</b>
        </p>
        <p className="text-gray-600 text-sm mb-6">
          Amount: <b>{amount}</b>
        </p>

        {/* ✅ TEMP Buttons for testing */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate(`/order-status/${order_id}?paid=1`)}
        >
          Simulate Success
        </Button>

        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={() => navigate(`/order-status/${order_id}?paid=0`)}
        >
          Simulate Failed
        </Button>
      </div>
    </div>
  )
}
