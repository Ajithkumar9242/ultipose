"use client"
import { useState } from "react"
import { X, Plus, Minus, Star, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { formatPriceAUD } from "../utils/currency"   // ⬅️ AUD formatter

export function ItemDetailsModal({ item, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(item?.variants?.[0])
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState("")

  if (!isOpen || !item) return null

  const handleAddOnToggle = addon => {
    setSelectedAddOns(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    )
  }

  const calculateTotal = () => {
    const basePrice = selectedVariant?.price || item.price
    const addOnsPrice = (selectedAddOns || []).reduce(
      (sum, addon) => sum + addon.price,
      0
    )
    // 🔹 Still returns raw number (e.g. cents) – we format only when displaying
    return (basePrice + addOnsPrice) * quantity
  }

  const handleAddToCartClick = () => {
    onAddToCart(
      item,
      quantity,
      selectedVariant,
      selectedAddOns,
      specialInstructions
    )

    toast.success(`${item.name} added to cart`)

    onClose()
    setQuantity(1)
    setSelectedAddOns([])
    setSpecialInstructions("")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Item Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Item Image and Basic Info */}
          <div className="flex gap-6 mb-6">
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              className="w-48 h-36 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-4 h-4 border-2 flex items-center justify-center ${
                    item.isVeg ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.isVeg ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <h3 className="text-2xl font-semibold">{item.name}</h3>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {item.rating ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {item.preparationTime || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Serves {item.serves ?? 1}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {item.description || "No description available."}
              </p>

              <div className="flex flex-wrap gap-1">
                {(item.tags || []).map(tag => (
                  <span
                    key={tag}
                    className={`px-2 py-1 text-xs rounded-full ${
                      tag.includes("Chef") || tag.includes("Restaurant")
                        ? "bg-blue-100 text-blue-600"
                        : tag.includes("Spicy")
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Ingredients</h4>
            <p className="text-gray-600">
              {(item.ingredients || []).length
                ? (item.ingredients || []).join(", ")
                : "Not specified."}
            </p>
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Choose Size</h4>
              <div className="space-y-2">
                {item.variants.map(variant => (
                  <label
                    key={variant.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => setSelectedVariant(variant)}
                        className="text-orange-500"
                      />
                      <span>{variant.name}</span>
                    </div>
                    <span className="font-medium">
                      {formatPriceAUD(variant.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Add-ons</h4>
              <div className="space-y-2">
                {item.addOns.map(addon => (
                  <label
                    key={addon.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAddOns.some(a => a.id === addon.id)}
                        onChange={() => handleAddOnToggle(addon)}
                        className="text-orange-500"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 border flex items-center justify-center ${
                            addon.isVeg ? "border-green-500" : "border-red-500"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              addon.isVeg ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                        <span>{addon.name}</span>
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatPriceAUD(addon.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Special Instructions</h4>
            <textarea
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests? (e.g., less spicy, extra sauce)"
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddToCartClick}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              Add to Cart - {formatPriceAUD(calculateTotal())}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
