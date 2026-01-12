import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Payment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const amount = params.get("amount")
  const orderId = params.get("order_id")

  const handlePayNow = () => {
    // ✅ pretend payment success
    navigate(`/order-status/${orderId}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-xl font-bold mb-2">Mock Payment</h1>
        <p className="text-gray-600 mb-4">
          Amount: <b>{amount}</b>
        </p>

        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handlePayNow}
        >
          Pay Now ✅
        </Button>
      </div>
    </div>
  )
}
