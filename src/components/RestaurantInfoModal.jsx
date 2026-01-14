"use client"

import { useEffect, useMemo, useState } from "react"
import api from "../api"
import { X, Info, Shield, RotateCcw, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"

const TAB_ICON = {
  details: <Info className="w-4 h-4" />,
  about: <Info className="w-4 h-4" />,
  privacy: <Shield className="w-4 h-4" />,
  refund: <RotateCcw className="w-4 h-4" />,
  contact: <PhoneCall className="w-4 h-4" />
}

export default function RestaurantInfoModal({
  isOpen,
  onClose,
  outletCode,
  initialTab = "details"
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setActiveTab(initialTab)
  }, [isOpen, initialTab])

  useEffect(() => {
    if (!isOpen || !outletCode) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get("/api/method/ultipos.api.store_info.get", {
          params: { outlet_code: outletCode }
        })
        setInfo(res?.data?.message || null)
      } catch (err) {
        console.log(err)
        setInfo(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isOpen, outletCode])

  const storeName = info?.storeName || "Restaurant"

  const tabs = useMemo(
    () => [
      { key: "details", label: "Restaurant Details" },
      { key: "about", label: "About Us" },
      { key: "refund", label: "Refund Policy" },
      { key: "privacy", label: "Privacy Policy" },
      { key: "contact", label: "Contact" }
    ],
    []
  )

  const getTabContent = () => {
    if (!info) return ""

    if (activeTab === "details") {
      return (
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <b>Restaurant:</b> {storeName}
          </p>
          <p>
            <b>Outlet Code:</b> {info.outlet_code || outletCode}
          </p>
          <p>
            <b>Address:</b> {info.address || "Not available"}
          </p>
          <p>
            <b>Phone:</b> {info.phone || "Not available"}
          </p>
          <p>
            <b>Email:</b> {info.email || "Not available"}
          </p>
        </div>
      )
    }

    if (activeTab === "about") return info.about_us || "Not available"
    if (activeTab === "refund") return info.refund_policy || "Not available"
    if (activeTab === "privacy") return info.privacy_policy || "Not available"
    if (activeTab === "contact") return info.contact_info || "Not available"

    return ""
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Info</p>
            <h2 className="text-lg font-extrabold text-gray-900">{storeName}</h2>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b bg-gray-50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                activeTab === t.key
                  ? "bg-white border-orange-300 text-orange-700"
                  : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-white"
              }`}
            >
              {TAB_ICON[t.key]}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
              {getTabContent()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-white flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
