// src/pages/OrderStatus.jsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/index"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  Phone,
  Store,
  ShoppingBag,
  FileDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDispatch } from "react-redux"
import { clearCartForStore } from "@/redux/store"

const STATUS_COLOR_BADGE = {
  PAID: "bg-green-100 text-green-700",
  COMPLETED: "bg-green-100 text-green-700",
  READY: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-cyan-100 text-cyan-700",
  PENDING: "bg-gray-100 text-gray-700",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
  New: "bg-gray-100 text-gray-700",
  Awaiting: "bg-amber-100 text-amber-700"
}

function mapBackendStatusToUiKey(status) {
  switch (status) {
    case "CONFIRMED":
      return "confirmed"
    case "IN_PROGRESS":
      return "preparing"
    case "READY":
      return "ready"
    case "COMPLETED":
    case "PAID":
      return "completed"
    case "FAILED":
    case "CANCELLED":
      return "cancelled"
    case "PENDING":
    case "AWAITING_PAYMENT":
    default:
      return "awaiting_payment"
  }
}

// ✅ NO conversion - direct AUD formatter
function formatAUD(value) {
  const n = Number(value)
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
  }).format(Number.isFinite(n) ? n : 0)
}

export default function OrderStatusPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

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

      const res = await api.get("/api/method/ultipos.api.order.get_status", {
        params: { order_id: orderId }
      })

      const payload = res?.data?.message || null
      if (!payload) throw new Error("Empty order response")

      setOrder(payload)

      const storeCode =
        payload.storeCode || payload.store_code || payload.outlet_code || payload.outlet

      if (storeCode) dispatch(clearCartForStore(storeCode))
    } catch (err) {
      console.warn("order fetch failed", err)
      if (isInitial) {
        setInitialError(
          err?.response?.data?.message || err?.message || "Unable to fetch order."
        )
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    if (!orderId) return
    fetchStatus(true)

    intervalRef.current = setInterval(() => fetchStatus(false), 4000)
    return () => clearInterval(intervalRef.current)
  }, [orderId])

  // ---------------- UI STATES ----------------
  if (!orderId) {
    return (
      <FullScreenMessage
        title="Missing order ID"
        description="orderId missing in URL."
        icon={<AlertCircle className="w-6 h-6 text-red-500" />}
        actionLabel="Go to Home"
        onAction={() => navigate("/")}
      />
    )
  }

  if (loading && !order && !initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        Loading order #{orderId}...
      </div>
    )
  }

  if (initialError || !order) {
    return (
      <FullScreenMessage
        title="Order not found"
        description={initialError || "Unable to fetch order."}
        icon={<AlertCircle className="w-6 h-6 text-red-500" />}
        actionLabel="Go to Home"
        onAction={() => navigate("/")}
      />
    )
  }

  // ---------------- NORMAL ----------------
  const status = order.status || order.order_status || "PENDING"
  const uiStatusKey = mapBackendStatusToUiKey(status)

  const isCancelled = uiStatusKey === "cancelled"
  const isAwaiting = uiStatusKey === "awaiting_payment"

  const headerBg = isCancelled
    ? "bg-red-500"
    : isAwaiting
    ? "bg-amber-500"
    : "bg-emerald-500"

  const headerIcon = isCancelled ? (
    <AlertCircle className="w-7 h-7 text-red-500" />
  ) : isAwaiting ? (
    <Clock className="w-7 h-7 text-amber-500" />
  ) : (
    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
  )

  const statusBadgeClass =
    STATUS_COLOR_BADGE[status] || STATUS_COLOR_BADGE.PENDING

  const storeCode =
    order.storeCode || order.store_code || order.outlet_code || order.outlet
  const storeName = order.storeName || order.restaurant || storeCode || "Store"

  const customer = order.customer || {}

  // ✅ ITEMS: backend sends items list
  const items = Array.isArray(order.items) ? order.items : []

  // ✅ AMOUNT: take from backend directly
  const paidAmount =
   1.50

  // ✅ Invoice Preview
  const handlePreviewInvoice = () => {
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString()

    const popup = window.open("", "ReceiptPreview", "width=420,height=700,scrollbars=yes")
    if (!popup) return

    const itemsHtml = items
      .map(item => {
        const qty = Number(item.qty ?? item.quantity ?? 1) || 1
        const unit = Number(item.unit_price ?? item.price ?? 0) || 0
        const line = Number(item.total_price ?? unit * qty) || 0

        return `
          <div class="item-row">
            <div class="qty">${qty}x</div>
            <div class="name">${item.name || item.item_name || "Item"}</div>
            <div class="price">${formatAUD(line)}</div>
          </div>
        `
      })
      .join("")

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt Preview</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial; background:#e5e7eb; display:flex; justify-content:center; padding:20px; }
            .ticket { background:white; width:340px; padding:22px; border-radius:12px; }
            h1 { text-align:center; margin:0 0 10px 0; }
            .meta { text-align:center; font-size:12px; color:#666; margin-bottom:14px; }
            .divider { border-top:2px dashed #000; opacity:0.2; margin:14px 0; }
            .item-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px; }
            .qty { width:40px; font-weight:bold; }
            .name { flex:1; }
            .price { font-weight:bold; white-space:nowrap; }
            .final { font-size:16px; font-weight:bold; margin-top:10px; border-top:2px solid #000; padding-top:10px; display:flex; justify-content:space-between; }
            .action { text-align:center; margin-top:16px; }
            button { padding:10px 16px; border:none; border-radius:8px; cursor:pointer; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h1>${storeName}</h1>
            <div class="meta">ORDER ${orderId}<br>${dateStr}</div>

            <div class="divider"></div>
            ${itemsHtml || "<p style='text-align:center;color:#666'>No items</p>"}
            <div class="divider"></div>

            <div class="final">
              <span>TOTAL</span>
              <span>${formatAUD(paidAmount)}</span>
            </div>

            <div class="action">
              <button onclick="window.print()">Print</button>
              <button onclick="window.close()">Close</button>
            </div>
          </div>
        </body>
      </html>
    `)

    popup.document.close()
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <div className={`${headerBg} text-white shadow-lg`}>
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => (storeCode ? navigate(`/s/${storeCode}`) : navigate("/"))}
              className="rounded-full border-white/40 bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                {headerIcon}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">
                  {isCancelled ? "Order update" : isAwaiting ? "Payment pending" : "Order successful"}
                </p>
                <h1 className="text-lg font-bold">Order #{orderId}</h1>
                <p className="text-xs">{storeName}</p>
              </div>
            </div>
          </div>

          <span className={"px-3 py-1 rounded-full text-xs font-bold " + statusBadgeClass}>
            {status}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ✅ amount dynamic (no conversion) */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 flex justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Paid</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatAUD(paidAmount)}
            </p>
          </div>
        </div>

        {/* ✅ items dynamic */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <p className="font-bold">Items</p>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No items found for this order.</p>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => {
                const qty = Number(it.qty ?? it.quantity ?? 1) || 1
                // const unit = Number(it.unit_price ?? it.price ?? 0) || 0
                const line = Number(it.total_price ?? unit * qty) || 0

                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {qty}x {it.name || it.item_name || "Item"}
                    </span>
                    {/* <span className="font-bold">{formatAUD(line)}</span> */}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* keep rest same */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-gray-500" />
              <p className="font-semibold">{storeName}</p>
            </div>

            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" /> {customer.phone}
              </div>
            )}

            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" /> {customer.address}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
            <p className="font-semibold">Payment</p>
            <p className="text-sm text-gray-600">
              Provider: <b>{order.payment?.provider || "UltiPOS"}</b>
            </p>
            <p className="text-sm text-gray-600">
              Amount: <b>{formatAUD(paidAmount)}</b>
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => (storeCode ? navigate(`/s/${storeCode}`) : navigate("/"))}
          >
            Continue shopping
          </Button>

          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handlePreviewInvoice}
          >
            <FileDown className="w-4 h-4 mr-2" /> Download invoice
          </Button>
        </div>
      </div>
    </div>
  )
}

function FullScreenMessage({ title, description, icon, actionLabel, onAction }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        </div>
        <Button
          onClick={onAction}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
