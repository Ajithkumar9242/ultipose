// src/components/AuthModal.jsx
"use client"
import { useState, useEffect } from "react"
import { X, Phone, Mail, User, ArrowRight } from "lucide-react" // Added ArrowRight for button
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative scale-100 animate-in zoom-in-95 duration-300">
        
        {/* Close Button (Floating) */}
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="p-8 pt-10">
          
          {/* Header Visual */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <User className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome!</h2>
            <p className="text-gray-500 text-sm mt-1">
              Please enter your details to place the order
            </p>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200">
                  <User className="w-5 h-5" />
              </div>
              <Input
                type="text"
                placeholder="Full Name"
                value={userDetails.name}
                onChange={e =>
                  setUserDetails({ ...userDetails, name: e.target.value })
                }
                className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus-visible:ring-orange-500 transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200">
                  <Mail className="w-5 h-5" />
              </div>
              <Input
                type="email"
                placeholder="Email Address"
                value={userDetails.email}
                onChange={e =>
                  setUserDetails({ ...userDetails, email: e.target.value })
                }
                className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus-visible:ring-orange-500 transition-all"
              />
            </div>

            {/* WhatsApp Number */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200">
                  <Phone className="w-5 h-5" />
              </div>
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
                className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus-visible:ring-orange-500 transition-all"
                maxLength={10}
              />
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={disableButton}
              className="w-full h-12 mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-200 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
            
            <p className="text-center text-[10px] text-gray-400">
                Your details are safe with us. We only use them for order updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}