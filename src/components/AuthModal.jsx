// src/components/AuthModal.jsx
"use client"
import { useState, useEffect } from "react"
import { X, Phone, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AuthModal({ isOpen, onClose, onAuthComplete, initialDetails }) {
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: ""
  })

  // 🔹 When modal opens, preload from initialDetails (Redux/localStorage)
  useEffect(() => {
    if (isOpen) {
      setUserDetails({
        name: initialDetails?.name || "",
        email: initialDetails?.email || "",
        phone: initialDetails?.phone || ""
      })
    }
  }, [isOpen, initialDetails])

  if (!isOpen) return null

  const handleContinue = () => {
    if (
      !userDetails.name ||
      !userDetails.email ||
      !userDetails.phone ||
      userDetails.phone.length !== 10
    ) {
      return
    }

    // Send details up to Menuu (which also stores in Redux)
    onAuthComplete(userDetails)
    onClose()
  }

  const disableButton =
    !userDetails.name ||
    !userDetails.email ||
    !userDetails.phone ||
    userDetails.phone.length !== 10

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Enter Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Enter your details to continue
              </p>
            </div>

            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Name"
                value={userDetails.name}
                onChange={e =>
                  setUserDetails({ ...userDetails, name: e.target.value })
                }
                className="pl-10"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="email"
                placeholder="Email"
                value={userDetails.email}
                onChange={e =>
                  setUserDetails({ ...userDetails, email: e.target.value })
                }
                className="pl-10"
              />
            </div>

            {/* WhatsApp Number */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="WhatsApp Number"
                value={userDetails.phone}
                onChange={e =>
                  setUserDetails({
                    ...userDetails,
                    phone: e.target.value.replace(/\D/g, "")
                  })
                }
                onPaste={e => {
                  const pasted = e.clipboardData.getData("Text")
                  if (/\D/.test(pasted)) {
                    e.preventDefault()
                  }
                }}
                className="pl-10"
                maxLength={10}
              />
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={disableButton}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
