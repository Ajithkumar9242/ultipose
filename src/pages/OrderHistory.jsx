"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { useSelector } from "react-redux"
import { ArrowLeft, Search, ShoppingBag, Clock } from "lucide-react"

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

const statusStyle = (status) => {
  const st = String(status || "").toUpperCase()

  if (["COMPLETED", "PAID"].includes(st)) return "bg-green-100 text-green-700"
  if (["READY", "ACCEPTED", "PREPARING", "IN_PROGRESS"].includes(st))
    return "bg-blue-100 text-blue-700"
  if (["CANCELLED", "FAILED"].includes(st)) return "bg-red-100 text-red-700"

  return "bg-gray-100 text-gray-700"
}

export default function OrderHistory() {
  const navigate = useNavigate()

  // ✅ Get saved user phone automatically (from Redux userSlice)
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

  // ✅ auto-fill phone if available
  useEffect(() => {
    if (savedUserPhone) setPhone(savedUserPhone)
  }, [savedUserPhone])

  // ✅ auto-load orders without typing
  useEffect(() => {
    if (savedUserPhone) {
      handleSearch(savedUserPhone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedUserPhone])

  const handleSearch = async (forcePhone) => {
    const cleanPhone = String(forcePhone ?? phone ?? "").trim()

    if (!cleanPhone) {
      toast.error("Enter phone number")
      return
    }

    try {
      setLoading(true)

      const res = await api.get(
        "/api/method/ultipos.api.order_history.get_orders_by_phone",
        { params: { phone: cleanPhone, limit: 50 } }
      )

      const payload = res?.data?.message
      const list = payload?.orders || []

      setOrders(list)

      if (list.length === 0) toast("No orders found for this phone.")
      else toast.success(`Loaded ${list.length} order(s) ✅`)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  const phoneLabel = useMemo(() => {
    const clean = String(phone || "").trim()
    if (!clean) return ""
    return clean.length > 4 ? `+${clean}` : clean
  }, [phone])

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Order History
              </h1>
              <p className="text-xs text-gray-500">
                Showing orders for {phoneLabel || "phone number"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white border rounded-2xl shadow-sm p-5 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="eg: 7229738482"
              className="mt-1 rounded-xl"
            />
          </div>

          <Button
            onClick={() => handleSearch()}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-6 font-bold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </span>
            )}
          </Button>
        </div>

        {/* Orders list */}
        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-12">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              No orders to show.
            </div>
          ) : (
            orders.map((o) => {
              const status = o.status || "NEW"
              const createdAt = new Date(o.createdAt).toLocaleString()
              const itemsPreview = Array.isArray(o.items_preview)
                ? o.items_preview
                : []

              return (
                <div
                  key={o.order_id}
                  className="bg-white border rounded-2xl shadow-sm p-5 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/order-status/${o.order_id}`)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-900">
                        Order #{o.order_id}
                      </p>

                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {createdAt}
                      </p>

                      <p className="text-xs text-gray-500">
                        Store:{" "}
                        <b className="text-gray-800">{o.storeName || "Store"}</b>
                      </p>

                      {/* ✅ Items Preview */}
                      {itemsPreview.length > 0 && (
                        <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                          <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">
                            Items ({o.items_total_qty || 0})
                          </p>

                          <div className="space-y-1">
                            {itemsPreview.slice(0, 3).map((it, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs text-gray-700"
                              >
                                <span className="font-semibold">
                                  {it.qty}x {it.name}
                                </span>
                                <span className="font-bold">
                                  {formatAUD(it.total_price)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {itemsPreview.length > 3 && (
                            <p className="text-[11px] mt-2 text-gray-500 font-semibold">
                              +{itemsPreview.length - 3} more items
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div
                        className={
                          "inline-flex px-3 py-1 rounded-full text-xs font-bold " +
                          statusStyle(status)
                        }
                      >
                        {String(status).toUpperCase()}
                      </div>

                      <p className="mt-3 text-lg font-extrabold text-gray-900">
                        {formatAUD(o.grand_total)}
                      </p>

                      {Number(o.discount || 0) > 0 && (
                        <p className="text-xs font-bold text-green-600">
                          Saved {formatAUD(o.discount)}
                        </p>
                      )}

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/order-status/${o.order_id}`)
                          }}
                        >
                          View Details
                        </Button>
                      </div>
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
