"use client"
import { useEffect, useState } from "react"
import { X, Plus, Minus, Star, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { formatPriceAUD } from "../utils/currency"

export function ItemDetailsModal({ item, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(item?.variants?.[0])
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState("")


    useEffect(() => {
    if (isOpen && item) {
      setQuantity(1)
      setSelectedVariant(item.variants?.[0] || null)
      setSelectedAddOns([])
      setSpecialInstructions("")
    }
  }, [isOpen, item])


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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-2 sm:px-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b px-4 sm:px-6 py-3 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold">
            Item Details
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Item Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="w-full md:w-52 shrink-0">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-40 md:h-36 object-cover rounded-xl shadow-sm"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm ${
                    item.isVeg ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-sm ${
                      item.isVeg ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <h3 className="text-lg sm:text-2xl font-semibold">
                  {item.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {item.rating ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{item.preparationTime || "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Serves {item.serves ?? 1}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                {item.description || "No description available."}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {(item.tags || []).map(tag => (
                  <span
                    key={tag}
                    className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-full border transition-colors ${
                      tag.includes("Chef") || tag.includes("Restaurant")
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : tag.includes("Spicy")
                        ? "bg-red-50 text-red-600 border-red-100"
                        : "bg-gray-50 text-gray-600 border-gray-100"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-1.5">
              Ingredients
            </h4>
            <p className="text-sm text-gray-600">
              {(item.ingredients || []).length
                ? (item.ingredients || []).join(", ")
                : "Not specified."}
            </p>
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-2">
                Choose Size
              </h4>
              <div className="space-y-2">
                {item.variants.map(variant => (
                  <label
                    key={variant.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedVariant?.id === variant.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => setSelectedVariant(variant)}
                        className="text-orange-500"
                      />
                      <span className="text-sm">{variant.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPriceAUD(variant.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addOns && item.addOns.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-2">
                Add-ons
              </h4>
              <div className="space-y-2">
                {item.addOns.map(addon => (
                  <label
                    key={addon.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedAddOns.some(a => a.id === addon.id)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
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
                          className={`w-3 h-3 border rounded-[3px] flex items-center justify-center ${
                            addon.isVeg
                              ? "border-green-500"
                              : "border-red-500"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-[2px] ${
                              addon.isVeg ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                        <span className="text-sm">{addon.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPriceAUD(addon.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-2">
              Special Instructions
            </h4>
            <textarea
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests? (e.g., less spicy, extra sauce)"
              className="w-full p-3 border rounded-lg resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-t pt-4">
            <div className="flex items-center gap-3">
              <span className="font-medium text-sm sm:text-base">
                Quantity:
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQuantity(prev => Math.max(1, prev - 1))
                  }
                  className="h-8 w-8"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddToCartClick}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg shadow-sm hover:shadow-md transition"
            >
              Add to Cart · {formatPriceAUD(calculateTotal())}
            </Button>
          </div>
        </div>
      </div>

      {/* Light animations */}
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeInOverlay 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUpModal 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
