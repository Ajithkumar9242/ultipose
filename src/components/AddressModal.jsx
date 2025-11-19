// src/components/AddressModal.jsx
"use client"
import { useState } from "react"
import { X, MapPin, Home, Briefcase, Plus, Check } from "lucide-react"
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
  selectedAddressId
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    type: "home",
    name: "",
    address: "",
    landmark: "",
    city: "Bangalore",
    pincode: ""
  })

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.pincode) {
      alert("Please fill all required fields")
      return
    }

    const addressData = {
      id: editingAddress?.id || Date.now().toString(),
      ...formData,
      isDefault: addresses.length === 0 // First address is default
    }

    if (editingAddress) {
      onUpdateAddress(addressData)
    } else {
      onAddAddress(addressData)
    }

    setShowAddForm(false)
    setEditingAddress(null)
    setFormData({
      type: "home",
      name: "",
      address: "",
      landmark: "",
      city: "Bangalore",
      pincode: ""
    })
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
        return <Home className="w-5 h-5" />
      case "work":
        return <Briefcase className="w-5 h-5" />
      default:
        return <MapPin className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {showAddForm
              ? editingAddress
                ? "Edit Address"
                : "Add New Address"
              : "Select Delivery Address"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          {!showAddForm ? (
            <>
              {/* Add New Address Button */}
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-4 border-2 border-dashed border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>

              {/* Address List */}
              <div className="space-y-3">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      onSelectAddress(address)
                      onClose()
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-gray-500 mt-1">
                          {getAddressIcon(address.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 capitalize">
                              {address.type}
                            </h3>
                            {address.isDefault && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                            {selectedAddressId === address.id && (
                              <Check className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-900 font-medium">
                            {address.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.address}
                          </p>
                          {address.landmark && (
                            <p className="text-sm text-gray-500">
                              Near {address.landmark}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.pincode}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
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
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation()
                              onDeleteAddress(address.id)
                            }}
                            className="text-red-500 border-red-500"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Add/Edit Address Form */
            <div className="space-y-4">
              {/* Address Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Type
                </label>
                <div className="flex gap-3">
                  {["home", "work", "other"].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        formData.type === type
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {getAddressIcon(type)}
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <Input
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Complete Address *
                </label>
                <textarea
                  placeholder="House/Flat no, Building name, Street name, Area"
                  value={formData.address}
                  onChange={e =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Landmark (Optional)
                </label>
                <Input
                  placeholder="e.g., Near Metro Station, Opposite Mall"
                  value={formData.landmark}
                  onChange={e =>
                    setFormData({ ...formData, landmark: e.target.value })
                  }
                />
              </div>

              {/* City and Pincode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    City *
                  </label>
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={e =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pincode *
                  </label>
                  <Input
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={e =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingAddress(null)
                    setFormData({
                      type: "home",
                      name: "",
                      address: "",
                      landmark: "",
                      city: "Bangalore",
                      pincode: ""
                    })
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
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
