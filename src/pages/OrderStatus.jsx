// src/pages/OrderStatus.jsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/index"
import { formatPriceAUD } from "../utils/currency"
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Store,
  ShoppingBag,
  ChefHat,
  Truck,
  Package,
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
  CANCELLED: "bg-red-100 text-red-700"
}

const UI_STAGES = [
  { key: "confirmed", label: "Order confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing order", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Truck },
  { key: "completed", label: "Completed", icon: Package }
]

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
    case "PENDING":
    case "AWAITING_PAYMENT":
      return "awaiting_payment"
    case "FAILED":
    case "CANCELLED":
      return "cancelled"
    default:
      return "pending"
  }
}

function formatUpdateEvent(event) {
  if (!event) return ""
  if (event.startsWith("action:")) {
    const key = event.split(":")[1]
    switch (key) {
      case "accept":
        return "Order accepted by store"
      case "ready":
        return "Order is ready"
      case "complete":
        return "Order completed"
      case "cancel":
        return "Order cancelled"
      default:
        return `Order ${key}`
    }
  }
  return event
}

export default function OrderStatusPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialError, setInitialError] = useState(null)
  const intervalRef = useRef(null)
  const invoiceRef = useRef(null)

  async function fetchStatus(isInitial = false) {
    try {
      if (isInitial) {
        setLoading(true)
        setInitialError(null)
      }

      let res
      try {
        res = await api.get(`/orders/${orderId}`)
      } catch (e) {
        res = await api.get(`/public-orders/${orderId}`)
      }

      const payload =
        res.data?.data?.order || res.data?.order || res.data || null

      setOrder(payload || null)

      // 🔥 IMPORTANT: once we know which store this order belongs to,
      // clear the cart for that store (Redux + localStorage via subscribe)
      if (payload?.storeCode) {
        dispatch(clearCartForStore(payload.storeCode))
      }
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

  // ---------- error / loading ----------
  if (!orderId) {
    return (
      <FullScreenMessage
        title="Missing order ID"
        description="We couldn&apos;t find an order ID in the URL."
        icon={<AlertCircle className="w-6 h-6 text-red-500" />}
        actionLabel="Go to Home"
        onAction={() => navigate("/")}
      />
    )
  }

  if (loading && !order && !initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600 animate-[fadeIn_0.25s_ease-out]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Loading order #{orderId}…</p>
        </div>
      </div>
    )
  }

  if (initialError || !order) {
    return (
      <FullScreenMessage
        title="Order not found"
        description={
          initialError ||
          "We couldn&apos;t retrieve details for this order."
        }
        icon={<AlertCircle className="w-6 h-6 text-red-500" />}
        actionLabel="Go to Home"
        onAction={() => navigate("/")}
      />
    )
  }

  // ---------- normal state ----------
  const status = order.status || "PENDING"
  const uiStatusKey = mapBackendStatusToUiKey(status)
  const isCancelled =
    uiStatusKey === "cancelled" ||
    status === "CANCELLED" ||
    status === "FAILED"
  const isAwaiting =
    uiStatusKey === "awaiting_payment" ||
    status === "AWAITING_PAYMENT" ||
    status === "PENDING"

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

  const updates = order.notifications?.updates || []
  const storeName = order.storeId?.name || order.storeCode || "Store"
  const customer = order.customer || {}

  const totals = order.totals || {
    subtotal: order.subtotal || 0,
    tax: order.tax || 0,
    deliveryFee: order.deliveryFee || 0,
    total: order.total || 0,
    currency: (order.totals && order.totals.currency) || "AUD"
  }

  const firstEvent =
    order.payment?.events && order.payment.events.length
      ? order.payment.events[0]
      : null
  const evalResult = firstEvent?.payload?.evalResult
  const discountCents =
    evalResult?.totalDiscountCents != null
      ? evalResult.totalDiscountCents
      : 0

  const activeStages = UI_STAGES.map(s => s.key)
  const currentStageIndex = activeStages.indexOf(uiStatusKey)
  const clampedIndex =
    currentStageIndex === -1 ? 0 : currentStageIndex
  const progressPercent =
    isCancelled || isAwaiting
      ? 0
      : (clampedIndex / (UI_STAGES.length - 1 || 1)) * 100

  let etaText = ""
  if (isCancelled) {
    etaText = "This order has been cancelled."
  } else if (isAwaiting) {
    etaText = "Awaiting payment confirmation from the gateway."
  } else {
    switch (uiStatusKey) {
      case "confirmed":
        etaText = "Restaurant has received your order."
        break
      case "preparing":
        etaText = "Your food is being prepared."
        break
      case "ready":
        etaText = "Your order is almost ready."
        break
      case "completed":
        etaText = "Order is completed. Enjoy your meal!"
        break
      default:
        etaText = ""
    }
  }

  const storeCode = order.storeCode

  const handleDownloadInvoice = () => {
    if (!invoiceRef.current) return

    const printContents = invoiceRef.current.innerHTML
    const popup = window.open("", "_blank", "width=900,height=700")
    if (!popup) return

    popup.document.write(`
      <html>
        <head>
          <title>Invoice #${orderId}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 24px;
              color: #111827;
              background: #ffffff;
            }
            h1,h2,h3,h4 { margin: 0 0 8px; }
            .section {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 16px 18px;
              margin-bottom: 16px;
            }
            .title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border-bottom: 1px solid #e5e7eb;
              padding: 8px 4px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f9fafb;
              font-weight: 600;
            }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className={headerBg + " text-white shadow-sm"}>
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                storeCode ? navigate(`/s/${storeCode}`) : navigate("/")
              }
              className="rounded-full border-white/50 bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                {headerIcon}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/80">
                  {isCancelled
                    ? "Order update"
                    : isAwaiting
                    ? "Payment in progress"
                    : "Order placed successfully"}
                </p>
                <h1 className="text-lg sm:text-xl font-semibold">
                  Order #{orderId}
                </h1>
                <p className="text-xs sm:text-sm text-white/80">
                  {storeName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-white/90">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Auto-refreshing every few seconds</span>
            </div>
            <span
              className={
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold " +
                statusBadgeClass
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* main content / invoice area */}
      <div
        className="max-w-5xl mx-auto px-4 py-6 space-y-6"
        ref={invoiceRef}
      >
        {/* tracker card */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4 animate-[fadeInUp_0.35s_ease-out]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Track your order
              </p>
              <p className="text-sm text-gray-700">
                Latest update:{" "}
                {order.updatedAt
                  ? new Date(order.updatedAt).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-gray-900">
                Total Paid: {formatPriceAUD(totals.total)}
              </p>
              {discountCents > 0 && (
                <p className="text-xs text-green-600">
                  Discount applied: {formatPriceAUD(discountCents)}
                </p>
              )}
            </div>
          </div>

          {!isCancelled && (
            <div className="relative mt-4">
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                {UI_STAGES.map((stage, index) => {
                  const isActive =
                    currentStageIndex !== -1 &&
                    index <= clampedIndex &&
                    !isAwaiting
                  const isCurrent =
                    currentStageIndex !== -1 &&
                    index === clampedIndex &&
                    !isAwaiting

                  const Icon = stage.icon

                  return (
                    <div
                      key={stage.key}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-gray-300 bg-white text-gray-400"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p
                        className={`text-xs mt-2 text-center ${
                          isCurrent
                            ? "font-semibold text-gray-900"
                            : isActive
                            ? "text-gray-800"
                            : "text-gray-400"
                        }`}
                      >
                        {stage.label}
                      </p>
                      {isCurrent && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1 animate-pulse" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div
            className={`mt-4 p-4 rounded-lg text-sm ${
              isCancelled
                ? "bg-red-50 text-red-800"
                : isAwaiting
                ? "bg-amber-50 text-amber-800"
                : "bg-blue-50 text-blue-800"
            }`}
          >
            <p className="font-medium">
              {isCancelled
                ? "Order cancelled"
                : isAwaiting
                ? "Awaiting payment confirmation"
                : "Order in progress"}
            </p>
            {etaText && (
              <p className="mt-1 text-xs sm:text-sm">
                {etaText}
              </p>
            )}
          </div>
        </div>

        {/* layout: items + customer/billing */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          <div className="md:col-span-3 space-y-4">
            {/* items */}
            <div className="bg-white rounded-2xl shadow-sm border p-5 animate-[fadeInUp_0.35s_ease-out_0.05s]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  Order items ({order.items?.length || 0})
                </p>
              </div>

              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-gray-500">
                  No items found for this order.
                </p>
              )}

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {(order.items || []).map(it => {
                  const linePriceCents =
                    (it.price || 0) * (it.quantity || 1)
                  return (
                    <div
                      key={it._id || it.itemId}
                      className="flex items-start justify-between text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {it.name || "Item"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty {it.quantity || 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatPriceAUD(it.price || 0)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPriceAUD(linePriceCents)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* bill summary */}
            <div className="bg-white rounded-2xl shadow-sm border p-5 animate-[fadeInUp_0.35s_ease-out_0.1s]">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">
                Bill summary
              </p>
              <div className="space-y-2 text-sm">
                <Row label="Item total">
                  {formatPriceAUD(totals.subtotal || 0)}
                </Row>
                <Row label="Tax">
                  {formatPriceAUD(totals.tax || 0)}
                </Row>
                <Row label="Delivery">
                  {formatPriceAUD(totals.deliveryFee || 0)}
                </Row>
                {discountCents > 0 && (
                  <Row label="Discount" accent="green">
                    -{formatPriceAUD(discountCents)}
                  </Row>
                )}
                <div className="border-t pt-3 mt-1 flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-900">
                    Total paid
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPriceAUD(totals.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* right: customer + payment */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-5 animate-[fadeInUp_0.35s_ease-out_0.08s]">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">
                Customer & delivery
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">
                    {storeName}
                  </span>
                </div>
                {customer.name && (
                  <div className="flex items-center gap-2">
                    <UsersIcon />
                    <span className="text-gray-800">
                      {customer.name}
                    </span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {customer.phone}
                    </span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 truncate">
                      {customer.email}
                    </span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      {customer.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-5 animate-[fadeInUp_0.35s_ease-out_0.12s]">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">
                Payment summary
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  Provider:{" "}
                  <span className="font-medium uppercase">
                    {order.payment?.provider || "N/A"}
                  </span>
                </p>
                <p className="text-gray-700">
                  Amount captured:{" "}
                  <span className="font-medium">
                    {order.payment?.amount != null
                      ? formatPriceAUD(order.payment.amount)
                      : formatPriceAUD(totals.total || 0)}
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                This is a read-only summary based on the latest payment
                status from the secure gateway.
              </p>
            </div>
          </div>
        </div>

        {!!updates.length && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 animate-[fadeInUp_0.35s_ease-out_0.15s]">
            <p className="text-xs font-medium text-gray-500 uppercase mb-4">
              Activity log
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
                      <div
                        key={idx}
                        className="relative flex gap-3 animate-[fadeIn_0.25s_ease-out]"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="absolute -left-[7px] mt-1">
                          <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-white shadow" />
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatUpdateEvent(u.event)}
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

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() =>
              storeCode ? navigate(`/s/${storeCode}`) : navigate("/")
            }
          >
            Continue shopping
          </Button>
          <Button
            className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2"
            onClick={handleDownloadInvoice}
          >
            <FileDown className="w-4 h-4" />
            Download invoice (PDF)
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Row({ label, children, accent }) {
  const accentClass =
    accent === "green"
      ? "text-green-600"
      : accent === "red"
      ? "text-red-600"
      : "text-gray-900"
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={"font-medium " + accentClass}>{children}</span>
    </div>
  )
}

function UsersIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4.003 4.003 0 0 0 4 4Zm0 2c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FullScreenMessage({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center space-y-4 animate-[fadeIn_0.25s_ease-out]">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
          {icon}
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          {title}
        </h1>
        <p className="text-sm text-gray-600">{description}</p>
        <Button
          onClick={onAction}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
