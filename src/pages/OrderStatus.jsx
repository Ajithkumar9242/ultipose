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
        // fallback like company code
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
        <div className="flex flex-col items-center gap-6 text-gray-600 animate-[fadeIn_0.5s_ease-out]">
          <div className="relative">
             <div className="absolute inset-0 rounded-full border-4 border-orange-100 animate-ping opacity-30"></div>
             <div className="w-14 h-14 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin shadow-lg" />
          </div>
          <p className="text-sm font-medium tracking-wide animate-pulse">Checking Order #{orderId}...</p>
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

  // ---- totals from API (all in cents) ----
  const rawTotals = order.totals || {}

  const subtotalCents =
    typeof rawTotals.subtotal === "number"
      ? rawTotals.subtotal
      : order.subtotal || 0

  const taxCents =
    typeof rawTotals.tax === "number"
      ? rawTotals.tax
      : order.tax || 0

  const deliveryCents =
    typeof rawTotals.deliveryFee === "number"
      ? rawTotals.deliveryFee
      : order.deliveryFee || 0

  const totalCents =
    typeof rawTotals.total === "number"
      ? rawTotals.total
      : order.total || subtotalCents + taxCents + deliveryCents

  const currency = rawTotals.currency || "AUD"

  // 🔥 this is what the gateway actually charged (Worldline)
  const paidAmountCents =
    typeof order.payment?.amount === "number"
      ? order.payment.amount
      : totalCents


  const firstEvent =
    order.payment?.events && order.payment.events.length
      ? order.payment.events[0]
      : null
  const evalResult = firstEvent?.payload?.evalResult
  const discountCents =
    evalResult?.totalDiscountCents != null
      ? evalResult.totalDiscountCents
      : 0

      // ✅ Make a safe display breakdown that matches what was paid
  const computedFromTotals =
    subtotalCents + taxCents + deliveryCents - discountCents

  // Only trust backend breakdown if it exactly matches the paid amount
  const hasValidBreakdown =
    computedFromTotals > 0 && computedFromTotals === paidAmountCents

  // If mismatch → just show everything as based on paid amount
  const itemTotalDisplayCents = hasValidBreakdown
    ? subtotalCents
    : paidAmountCents + discountCents

  const taxDisplayCents = hasValidBreakdown ? taxCents : 0
  const deliveryDisplayCents = hasValidBreakdown ? deliveryCents : 0


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
    <div className="min-h-screen bg-gray-50/50">
      {/* header */}
      <div className={`${headerBg} text-white shadow-lg transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 animate-[fadeIn_0.5s_ease-out]">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                storeCode ? navigate(`/s/${storeCode}`) : navigate("/")
              }
              className="rounded-full border-white/40 bg-white/10 hover:bg-white/20 hover:scale-105 transition-all text-white active:scale-95 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
                {headerIcon}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/80 font-semibold mb-0.5">
                  {isCancelled
                    ? "Order update"
                    : isAwaiting
                    ? "Payment in progress"
                    : "Order placed successfully"}
                </p>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                  Order #{orderId}
                </h1>
                <p className="text-xs sm:text-sm text-white/90 font-medium">
                  {storeName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 text-xs text-white/90 animate-[fadeIn_0.5s_ease-out_0.1s]">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>Live updates</span>
            </div>
            <span
              className={
                "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-sm " +
                statusBadgeClass
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* main content / invoice area */}
      <div
        className="max-w-5xl mx-auto px-4 py-8 space-y-6"
        ref={invoiceRef}
      >
        {/* tracker card */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-gray-100 p-6 space-y-6 animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Order Status
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated:{" "}
                <span className="text-gray-900 font-medium">
                {order.updatedAt
                  ? new Date(order.updatedAt).toLocaleString()
                  : "—"}
                </span>
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatPriceAUD(paidAmountCents)}
              </p>
              {discountCents > 0 && (
                <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                  Saved {formatPriceAUD(discountCents)}
                </p>
              )}
            </div>
          </div>

          {!isCancelled && (
            <div className="relative mt-8 px-2">
              {/* Background track */}
              <div className="absolute top-6 left-6 right-6 h-1.5 bg-gray-100 rounded-full -z-10 overflow-hidden">
                {/* Active progress with shimmer */}
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
                      className="flex flex-col items-center flex-1 group"
                    >
                      <div className="relative">
                        {isCurrent && (
                          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                        )}
                        {isCurrent && (
                          <div className="absolute -inset-2 rounded-full border border-emerald-100 animate-[pulseRing_2s_cubic-bezier(0.215,0.61,0.355,1)_infinite]" />
                        )}
                        
                        <div
                          className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${
                            isActive
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-emerald-200 shadow-md scale-110"
                              : "border-gray-200 bg-white text-gray-300 group-hover:border-gray-300"
                          } ${isActive ? 'animate-[scaleIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}`}
                        >
                          <Icon className={`w-5 h-5 transition-transform duration-300 ${isCurrent ? 'scale-110' : ''}`} />
                        </div>
                      </div>
                      
                      <p
                        className={`text-xs mt-3 text-center font-medium transition-colors duration-300 ${
                          isCurrent
                            ? "text-emerald-700 font-bold transform scale-105"
                            : isActive
                            ? "text-gray-800"
                            : "text-gray-400"
                        }`}
                      >
                        {stage.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div
            className={`mt-2 p-4 rounded-xl text-sm border flex items-start gap-3 transition-colors duration-300 ${
              isCancelled
                ? "bg-red-50 text-red-900 border-red-100"
                : isAwaiting
                ? "bg-amber-50 text-amber-900 border-amber-100"
                : "bg-blue-50 text-blue-900 border-blue-100"
            }`}
          >
            <div className={`mt-0.5 p-1.5 rounded-full ${isCancelled ? 'bg-red-100/50' : isAwaiting ? 'bg-amber-100/50' : 'bg-blue-100/50'}`}>
                {isCancelled ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-pulse" />}
            </div>
            <div>
                <p className="font-bold">
                {isCancelled
                    ? "Order cancelled"
                    : isAwaiting
                    ? "Awaiting payment confirmation"
                    : "Order in progress"}
                </p>
                {etaText && (
                <p className="mt-1 text-xs sm:text-sm opacity-90 leading-relaxed">
                    {etaText}
                </p>
                )}
            </div>
          </div>
        </div>

        {/* layout: items + customer/billing */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          <div className="md:col-span-3 space-y-4">
            {/* items */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-gray-100 p-6 animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)]" style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">
                    Your Selection
                    </p>
                    <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                </div>
              </div>

              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-gray-500 italic">
                  No items found for this order.
                </p>
              )}

              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {(order.items || []).map((it, idx) => {
                  const linePriceCents =
                    (it.price || 0) * (it.quantity || 1)
                  return (
                    <div
                      key={it._id || it.itemId}
                      className="flex items-start justify-between text-sm group animate-[slideInRight_0.5s_ease-out_both]"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="flex gap-3">
                         <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                            {it.quantity}x
                         </div>
                         <div>
                            <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                            {it.name || "Item"}
                            </p>
                            {/* Placeholder for modifiers if they existed in data */}
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatPriceAUD(linePriceCents)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* bill summary */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-gray-100 p-6 animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)]" style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
              <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">
                Summary
              </p>
              <div className="space-y-3 text-sm">
                {/* Item total (safe) */}
                <Row label="Item total">
                  {formatPriceAUD(itemTotalDisplayCents)}
                </Row>

                {/* Only show tax if it makes sense */}
                {taxDisplayCents > 0 && (
                  <Row label="Tax">
                    {formatPriceAUD(taxDisplayCents)}
                  </Row>
                )}

                {/* Only show delivery if it makes sense */}
                {deliveryDisplayCents > 0 && (
                  <Row label="Delivery">
                    {formatPriceAUD(deliveryDisplayCents)}
                  </Row>
                )}

                {/* Discount from evalResult if any */}
                {discountCents > 0 && (
                  <Row label="Discount" accent="green">
                    -{formatPriceAUD(discountCents)}
                  </Row>
                )}

                {/* Always show what was actually paid to ANZ */}
                <div className="border-t border-dashed border-gray-200 pt-4 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">
                    Total Paid
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatPriceAUD(paidAmountCents)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* right: customer + payment */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-gray-100 p-6 animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)]" style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
              <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">
                Details
              </p>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3 group">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                    <Store className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Restaurant</p>
                    <span className="font-semibold text-gray-900">
                      {storeName}
                    </span>
                  </div>
                </div>

                {customer.name && (
                  <div className="flex items-start gap-3 group">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                       <UsersIcon />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Customer</p>
                        <span className="font-medium text-gray-900">
                        {customer.name}
                        </span>
                    </div>
                  </div>
                )}

                {(customer.phone || customer.email) && (
                  <div className="flex items-start gap-3 group">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <Phone className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xs text-gray-500 mb-0.5">Contact</p>
                        {customer.phone && <span className="text-gray-700">{customer.phone}</span>}
                        {customer.email && <span className="text-gray-700 text-xs">{customer.email}</span>}
                    </div>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3 group">
                     <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <MapPin className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 mb-0.5">Delivery Address</p>
                        <span className="text-gray-700 leading-relaxed block">
                        {customer.address}
                        </span>
                     </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-gray-100 p-6 animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)]" style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
              <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">
                Payment Info
              </p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-xs">Provider</span>
                    <span className="font-semibold text-xs uppercase bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                    {order.payment?.provider || "N/A"}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Amount</span>
                    <span className="font-bold text-green-700">
                        {order.payment?.amount != null
                        ? formatPriceAUD(order.payment.amount)
                        : formatPriceAUD(paidAmountCents)}
                    </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Securely processed via Payment Gateway
              </p>
            </div>
          </div>
        </div>

   

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-4 pt-4 border-t border-gray-200 animate-[fadeIn_0.5s_ease-out]" style={{ animationDelay: '600ms' }}>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 active:scale-95"
            onClick={() =>
              storeCode ? navigate(`/s/${storeCode}`) : navigate("/")
            }
          >
            Continue shopping
          </Button>
          <Button
            className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-sm shadow-orange-200 hover:shadow-md transition-all duration-200 active:scale-95"
            onClick={handleDownloadInvoice}
          >
            <FileDown className="w-4 h-4" />
            Download invoice (PDF)
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .custom-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  )
}

function Row({ label, children, accent }) {
  const accentClass =
    accent === "green"
      ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"
      : accent === "red"
      ? "text-red-600 bg-red-50 px-2 py-0.5 rounded"
      : "text-gray-900"
  return (
    <div className="flex justify-between text-sm group">
      <span className="text-gray-500 group-hover:text-gray-700 transition-colors">{label}</span>
      <span className={"font-medium " + accentClass}>{children}</span>
    </div>
  )
}

function UsersIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-colors"
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
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 animate-[fadeInUp_0.4s_ease-out]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 animate-bounce">
          {icon}
        </div>
        <div>
            <h1 className="text-xl font-bold text-gray-900">
            {title}
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
        </div>
        <Button
          onClick={onAction}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-11 shadow-lg shadow-orange-100 active:scale-95 transition-all"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}