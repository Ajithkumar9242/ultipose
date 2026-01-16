"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import api from "@/api"

export default function FakePayment() {
  const navigate = useNavigate()
  const { state } = useLocation()

  const data = state?.data || null

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Payment session expired.</p>
      </div>
    )
  }

  const {
    outlet_code,
    customerObj,
    customer_id,
    itemsPayload,
    orderDetails,
    amount
  } = data

  const handleYesPay = async () => {
    try {
      toast.loading("Processing payment...", { id: "pay" })

      // ✅ after payment success, PLACE ORDER
      const paymentObj = {
        method: "Online",
        transaction_id: "FAKE-TX-" + Date.now()
      }

      const orderRes = await api.post("/api/method/ultipos.api.order.place", {
        outlet_code,
        customer_id,

        customer_name: customerObj?.name || "",
        customer_phone: customerObj?.phone || "",
        customer_email: customerObj?.email || "",
        delivery_address: orderDetails?.deliveryAddress || "",

        items: JSON.stringify(itemsPayload),
        payment: JSON.stringify(paymentObj),

        coupon_code: orderDetails?.appliedCoupon?.code || null,
        order_type: orderDetails?.orderType || "Delivery",
        notes: orderDetails?.notes || null
      })

      const orderData = orderRes?.data?.message
      const orderId = orderData?.order_id

      if (!orderId) {
        toast.error("Order failed")
        return
      }

      toast.success("Payment successful ✅ Order placed!", { id: "pay" })

      navigate(`/order-status/${orderId}`)
    } catch (err) {
      console.error(err)
      toast.error("Payment failed", { id: "pay" })
      navigate("/checkout")
    }
  }

  const handleNoPay = () => {
    toast("Payment cancelled ❌")
    navigate("/checkout")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border shadow-lg rounded-2xl p-8 max-w-md w-full space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Fake Payment Gateway</h1>

        <p className="text-sm text-gray-600">
          Outlet: <b>{outlet_code}</b>
        </p>

        <p className="text-sm text-gray-600">
          Amount: <b>${Number(amount || 0).toFixed(2)}</b>
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleYesPay}
          >
            YES PAY ✅
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={handleNoPay}
          >
            NO ❌
          </Button>
        </div>
      </div>
    </div>
  )
}
