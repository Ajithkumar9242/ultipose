"use client"

import { useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import api from "@/api"

export default function FakePayment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderId = searchParams.get("order_id")
  const amount = searchParams.get("amount")
  const gateway = searchParams.get("gateway") || "Secure Gateway"

  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-bold text-lg">Payment session invalid or expired.</p>
      </div>
    )
  }

  // Format card number with spaces
  const handleCardChange = (e) => {
    let val = e.target.value.replace(/\D/g, "")
    let formatted = val.match(/.{1,4}/g)?.join(" ") || ""
    setCardNumber(formatted.substring(0, 19))
  }

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length >= 2) val = val.substring(0, 2) + "/" + val.substring(2, 4)
    setExpiry(val.substring(0, 5))
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    
    if (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || !name) {
      toast.error("Please fill in all card details correctly.")
      return
    }

    setIsProcessing(true)
    toast.loading(`Authenticating with ${gateway}...`, { id: "pay" })

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 🎯 SIMULATE REAL CARD DECLINES (e.g., if card starts with 5, fail it)
    if (cardNumber.startsWith("5555")) {
      setIsProcessing(false)
      toast.error("Card Declined: Insufficient Funds", { id: "pay" })
      return
    }

    try {
      // Tell backend the card was approved
      const res = await api.post("/api/method/ultipos.api.payment_gateways.process_mock_payment", {
        order_id: orderId,
        gateway: gateway
      })

      if (res.data?.message?.success) {
        toast.success("Payment Approved! ✅", { id: "pay" })
        navigate(`/order-status/${orderId}?payment=success`)
      } else {
        throw new Error("Gateway rejected payment")
      }
    } catch (err) {
      console.error(err)
      toast.error("Transaction failed. Please try a different card.", { id: "pay" })
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    toast.error("Payment cancelled by user")
    navigate(`/order-status/${orderId}?payment=cancelled`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fc] px-4 font-sans">
      
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{gateway} Checkout</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Test Mode Environment</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden max-w-md w-full">
        
        {/* Receipt Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Amount Due</p>
            <p className="text-3xl font-black text-gray-900">${Number(amount || 0).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Order</p>
            <p className="text-sm font-bold text-gray-700">{orderId}</p>
          </div>
        </div>

        {/* Card Form */}
        <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Cardholder Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-shadow"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Card Number</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={handleCardChange}
                maxLength="19"
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 pl-10 outline-none font-mono transition-shadow"
                required
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Expiry</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                maxLength="5"
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none font-mono transition-shadow"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">CVC</label>
              <input 
                type="text" 
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").substring(0, 4))}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none font-mono transition-shadow"
                required
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              {isProcessing ? "Processing..." : `Pay $${Number(amount || 0).toFixed(2)}`}
            </Button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full text-center text-sm font-bold text-gray-400 hover:text-red-500 transition-colors py-2"
            >
              Cancel and return to store
            </button>
          </div>

        </form>
      </div>

      <div className="mt-6 flex gap-2 text-gray-400">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
        <p className="text-sm font-medium">Secured by {gateway} Sandbox</p>
      </div>

    </div>
  )
}