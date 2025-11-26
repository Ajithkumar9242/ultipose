// src/components/AddressModal.jsx
"use client"
import { useState } from "react"
import { X, MapPin, Home, Briefcase, Plus, Check, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AddressModal({
  isOpen,
  onClose,
  addresses,
  onSelectAddress,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  selectedAddressId,
  defaultName = ""   // 🔥 NEW
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    type: "home",
    name: "",
    address: "",
    landmark: "",
    city: "",
    pincode: ""
  })
  const [isLocating, setIsLocating] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setFormData({
      type: "home",
      name: defaultName || "",
      address: "",
      landmark: "",
      city: "",
      pincode: ""
    })
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.pincode) {
      alert("Please fill all required fields")
      return
    }

    const addressData = {
      id: editingAddress?.id || Date.now().toString(),
      ...formData,
      isDefault: addresses.length === 0 // First address is default (just label)
    }

    if (editingAddress) {
      onUpdateAddress(addressData)
    } else {
      onAddAddress(addressData)
    }

    setShowAddForm(false)
    setEditingAddress(null)
    resetForm()
  }

  const handleEdit = address => {
    setEditingAddress(address)
    setFormData({
      type: address.type,
      name: address.name,
      address: address.address,
      landmark: address.landmark || "",
      city: address.city,
      pincode: address.pincode
    })
    setShowAddForm(true)
  }

  const getAddressIcon = type => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4" />
      case "work":
        return <Briefcase className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  // 🔹 Use browser location to autofill address fields
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()

          const displayAddress = data.display_name || ""
          const addr = data.address || {}

          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            formData.city

          const pincode = addr.postcode || formData.pincode

          setFormData(prev => ({
            ...prev,
            address: displayAddress || prev.address,
            city: city,
            pincode: pincode
          }))
        } catch (err) {
          console.error("Error reverse geocoding:", err)
          alert("Could not fetch address from location.")
        } finally {
          setIsLocating(false)
        }
      },
      error => {
        console.log("Location denied or failed:", error)
        alert(
          "We couldn't get your location. Please allow location or fill address manually."
        )
        setIsLocating(false)
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100 p-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {showAddForm
                ? editingAddress
                  ? "Edit Address"
                  : "New Address"
                : "Delivery Address"}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {showAddForm ? "Fill in the details below" : "Choose where we deliver"}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          {!showAddForm ? (
            <div className="space-y-4">
              
              {/* Address List */}
              <div className="grid gap-3">
                {addresses.map(address => {
                  const isSelected = selectedAddressId === address.id;
                  
                  return (
                    <div
                      key={address.id}
                      onClick={() => {
                        onSelectAddress(address)
                        onClose()
                      }}
                      className={`relative group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/50"
                          : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon Box */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-orange-100 text-orange-600" : "bg-white text-gray-500 shadow-sm"
                        }`}>
                          {getAddressIcon(address.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-bold text-gray-900 capitalize text-base">
                              {address.type}
                            </h3>
                            {address.isDefault && (
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {address.name}
                          </p>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mt-1">
                            {address.address}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {address.city} • {address.pincode}
                          </p>
                        </div>
                        
                        {/* Selection Checkmark */}
                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-orange-500 text-white p-1 rounded-full shadow-lg shadow-orange-200">
                             <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (Hover only on desktop, always visible on mobile if needed) */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                          onClick={e => {
                            e.stopPropagation()
                            handleEdit(address)
                          }}
                        >
                          Edit
                        </Button>
                        {!address.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={e => {
                              e.stopPropagation()
                              onDeleteAddress(address.id)
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

               {/* Add New Address Button */}
               <button
                onClick={() => {
                  setEditingAddress(null)
                  resetForm()       // 🔥 prefill name from defaultName
                  setShowAddForm(true)
                }}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-medium hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                     <Plus className="w-4 h-4" />
                </div>
                Add New Address
              </button>
            </div>
          ) : (
            /* Add/Edit Address Form */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Address Type Selection */}
              <div className="p-1 bg-gray-100 rounded-xl flex gap-1">
                {["home", "work", "other"].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      formData.type === type
                        ? "bg-white text-orange-600 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {getAddressIcon(type)}
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Contact Name
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-11 rounded-xl border-gray-200 focus-visible:ring-orange-500"
                  />
                </div>

                {/* Address + GPS Button */}
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Address Details
                      </label>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                      >
                        {isLocating ? (
                            <span className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <Navigation className="w-3 h-3 fill-current" />
                        )}
                        {isLocating ? "Locating..." : "Use Current Location"}
                      </button>
                   </div>
                  <textarea
                    placeholder="House/Flat No., Building Name, Street..."
                    value={formData.address}
                    onChange={e =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full p-3 h-24 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Landmark */}
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Landmark
                  </label>
                  <Input
                    placeholder="e.g. Near Central Park"
                    value={formData.landmark}
                    onChange={e =>
                      setFormData({ ...formData, landmark: e.target.value })
                    }
                    className="h-11 rounded-xl border-gray-200 focus-visible:ring-orange-500"
                  />
                </div>

                {/* City & Pincode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        City
                    </label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={e =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="h-11 rounded-xl border-gray-200 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Pincode
                    </label>
                    <Input
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={e =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                      maxLength={6}
                      className="h-11 rounded-xl border-gray-200 focus-visible:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingAddress(null)
                    resetForm()
                  }}
                  className="h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-200"
                >
                  {editingAddress ? "Update Address" : "Save Address"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}