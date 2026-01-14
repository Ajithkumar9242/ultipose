"use client"

import { useState } from "react"
import RestaurantInfoModal from "./RestaurantInfoModal"

export default function FooterLinks({ outletCode }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("details")

  const openModal = (key) => {
    setTab(key)
    setOpen(true)
  }

  return (
    <>
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-extrabold text-gray-900 mb-3">Company</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <button
                onClick={() => openModal("about")}
                className="hover:text-orange-600 font-semibold"
              >
                About Us
              </button>
              <br />
              <button
                onClick={() => openModal("contact")}
                className="hover:text-orange-600 font-semibold"
              >
                Contact
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 mb-3">Policies</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <button
                onClick={() => openModal("privacy")}
                className="hover:text-orange-600 font-semibold"
              >
                Privacy Policy
              </button>
              <br />
              <button
                onClick={() => openModal("refund")}
                className="hover:text-orange-600 font-semibold"
              >
                Refund Policy
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-900 mb-3">Restaurant</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <button
                onClick={() => openModal("details")}
                className="hover:text-orange-600 font-semibold"
              >
                Restaurant Details
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <h4 className="font-extrabold text-gray-900 mb-3">UltiPOS</h4>
            <p className="leading-relaxed">
              Built for modern restaurant ordering. Fast. Smooth. Reliable.
            </p>
          </div>
        </div>
      </footer>

      <RestaurantInfoModal
        isOpen={open}
        onClose={() => setOpen(false)}
        outletCode={outletCode}
        initialTab={tab}
      />
    </>
  )
}
