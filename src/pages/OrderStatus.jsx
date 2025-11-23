// src/pages/OrderStatus.jsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/index"
// ⬇️ changed this line
import { formatPriceAUD } from "../utils/currency"
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STATUS_COLOR = {
  PAID: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  READY: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  CONFIRMED: "bg-cyan-100 text-cyan-700",
  PENDING: "bg-gray-100 text-gray-700",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700"
}

export default function OrderStatusPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialError, setInitialError] = useState(null)
  const intervalRef = useRef(null)

  async function fetchStatus(isInitial = false) {
    try {
      if (isInitial) {
        setLoading(true)
        setInitialError(null)
      }

      let res
      try {
        res = await api.get(`/public-orders/${orderId}`)
      } catch (e) {
        // fallback like company code
        res = await api.get(`/orders/${orderId}`)
      }

      const payload =
        res.data?.data?.order || res.data?.order || res.data || null
      setOrder(payload || null)
    } catch (err) {
      console.warn("order fetch failed", err)
      if (isInitial) {
        setInitialError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Unable to fetch order."
        )
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    if (!orderId) return
    fetchStatus(true)
    intervalRef.current = setInterval(() => {
      fetchStatus(false)
    }, 4000)
    return () => clearInterval(intervalRef.current)
  }, [orderId])

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Missing order ID
          </h1>
          <p className="text-sm text-gray-600">
            We couldn&apos;t find an order ID in the URL.
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

  if (loading && !order && !initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Loading order #{orderId}…</p>
        </div>
      </div>
    )
  }

  if (initialError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Order not found
          </h1>
          <p className="text-sm text-gray-600">
            {initialError || "We couldn&apos;t retrieve details for this order."}
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

  const status = order.status || "PENDING"
  const statusClass = STATUS_COLOR[status] || STATUS_COLOR.PENDING
  const updates = order.notifications?.updates || []
  const totals = order.totals || {
    total: order.total || 0,
    currency: order.totals?.currency || "AUD"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Order status
              </p>
              <h1 className="text-lg font-semibold">
                Order #{orderId}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Auto-refreshing every few seconds</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Top card with status & total */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Current status
            </p>
            <div className="inline-flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}
              >
                {status}
              </span>
              {status === "PAID" || status === "COMPLETED" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : null}
            </div>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Total paid
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatPriceAUD(totals.total)}
            </p>
          </div>
        </div>

        {/* Updates timeline (if any) */}
        {!!updates.length && (
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-xs font-medium text-gray-500 uppercase mb-4">
              Updates
            </p>
            <div className="relative pl-4">
              <div className="absolute left-1 top-1 bottom-1 w-px bg-gray-200" />
              <div className="space-y-4">
                {updates
                  .slice()
                  .reverse()
                  .map((u, idx) => {
                    const ts =
                      u.at || u.receivedAt || u.createdAt || null
                    const dateStr = ts
                      ? new Date(ts).toLocaleString()
                      : ""
                    return (
                      <div key={idx} className="relative flex gap-3">
                        <div className="absolute -left-[7px] mt-1">
                          <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-white shadow" />
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {u.event}
                          </p>
                          {dateStr && (
                            <p className="text-xs text-gray-500">
                              {dateStr}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
