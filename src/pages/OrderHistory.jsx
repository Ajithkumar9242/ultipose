"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { useSelector } from "react-redux"
import { ArrowLeft, Search, ShoppingBag, Calendar, Store, ChevronRight, Receipt } from "lucide-react"

// ✅ AUD formatter
function formatAUD(value) {
  const n = Number(value)
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(n) ? n : 0)
}

const getStatusColor = (status) => {
  const st = String(status || "").toUpperCase()
  switch (st) {
    case "COMPLETED":
    case "PAID":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "READY":
    case "ACCEPTED":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "PREPARING":
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "CANCELLED":
    case "FAILED":
      return "bg-red-100 text-red-700 border-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function OrderHistory() {
  const navigate = useNavigate()

  // ✅ Get saved user phone automatically
  const currentStore = useSelector((state) => state.cart.currentStore)
  const savedUserPhone = useSelector((state) => {
    const byStore = state.user.byStore || {}
    return currentStore && byStore[currentStore]?.phone
      ? byStore[currentStore].phone
      : ""
  })

  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])

  // ✅ auto-fill phone
  useEffect(() => {
    if (savedUserPhone) setPhone(savedUserPhone)
  }, [savedUserPhone])

  // ✅ auto-load
  useEffect(() => {
    if (savedUserPhone) {
      handleSearch(savedUserPhone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedUserPhone])

  const handleSearch = async (forcePhone) => {
    const cleanPhone = String(forcePhone ?? phone ?? "").trim()

    if (!cleanPhone) {
      toast.error("Please enter a phone number")
      return
    }

    try {
      setLoading(true)
      const res = await api.get(
        "/api/method/ultipos.api.order_history.get_orders_by_phone",
        { params: { phone: cleanPhone, limit: 50 } }
      )

      const list = res?.data?.message?.orders || []
      setOrders(list)

      if (list.length === 0) toast("No orders found.")
      else toast.success(`Found ${list.length} orders`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                My Orders
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-8">
        
        {/* Search Box */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Find by Phone Number
          </label>
          <div className="flex gap-2">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0412 345 678"
              className="h-12 rounded-xl border-gray-200 text-lg bg-gray-50 focus:bg-white transition-colors"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="h-12 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-100"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="font-bold text-gray-800 text-lg">Recent Orders</h2>
             <span className="text-xs text-gray-400 font-medium">{orders.length} orders found</span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">No orders yet</h3>
              <p className="text-gray-500 text-sm">Enter your phone number above to see your history.</p>
            </div>
          ) : (
            orders.map((o) => {
              const status = o.status || "NEW"
              const items = o.items_preview || []
              const date = new Date(o.createdAt).toLocaleDateString("en-AU", { 
                day: 'numeric', month: 'short', year: 'numeric' 
              })
              const time = new Date(o.createdAt).toLocaleTimeString("en-AU", {
                hour: '2-digit', minute: '2-digit'
              })

              return (
                <div
                  key={o.order_id}
                  onClick={() => navigate(`/order-status/${o.order_id}`)}
                  className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900 leading-tight">
                           {o.storeName || "Store Order"}
                         </h3>
                         <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{time}</span>
                         </div>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>

                  {/* Items Preview Block */}
                  {items.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
                      {items.slice(0, 3).map((it, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span className="flex gap-2">
                             <span className="font-bold text-gray-400 w-4">{it.qty}x</span>
                             <span className="truncate max-w-[180px]">{it.name}</span>
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[10px] text-gray-400 font-medium pl-6 pt-1">
                          +{items.length - 3} more items...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                       <span className="text-lg font-bold text-gray-900">{formatAUD(o.grand_total)}</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                      Details <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}