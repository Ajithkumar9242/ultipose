"use client"
import { useEffect, useMemo, useState } from "react"
import { X, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { formatPriceAUD } from "../utils/currency"

export function ItemDetailsModal({ item, isOpen, onClose, onAddToCart }) {
  const safeItem = item || {}

  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [selectedModifiers, setSelectedModifiers] = useState({})

  // ✅ backend: customizations
  const modifiers = useMemo(() => {
    return Array.isArray(safeItem.customizations) ? safeItem.customizations : []
  }, [safeItem.customizations])

  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1)
      setSelectedVariant(item.variants?.[0] || null)
      setSelectedAddOns([])
      setSpecialInstructions("")
      setSelectedModifiers({})
    }
  }, [isOpen, item])

  // -----------------------------
  // HELPERS
  // -----------------------------
const setModifierValue = (groupName, optionId, mode = "single") => {
  setSelectedModifiers(prev => {
    const next = { ...prev }
    const current = Array.isArray(next[groupName]) ? next[groupName] : []

    if (mode === "single") {
      next[groupName] = [optionId]
      return next
    }

    // multi
    if (current.includes(optionId)) {
      next[groupName] = current.filter(x => x !== optionId)
    } else {
      next[groupName] = [...current, optionId]
    }

    return next
  })
}


  // ✅ store selected modifier objects in cart
  const selectedModifierObjects = useMemo(() => {
    const output = []

    for (const mod of modifiers) {
      const group = mod.group_id || mod.name
      const selected = selectedModifiers[group] || []

      for (const opt of mod.options || []) {
        const optId = opt.option_id || opt.name
        if (selected.includes(optId)) {
          output.push({
            group,
            id: optId,
            name: opt.name,
            price: Number(opt.price ?? 0)
          })
        }
      }
    }

    return output
  }, [modifiers, selectedModifiers])

  const modifiersTotal = useMemo(() => {
    return selectedModifierObjects.reduce((sum, o) => sum + (o.price || 0), 0)
  }, [selectedModifierObjects])

  const calculateTotal = () => {
    const basePrice = Number(selectedVariant?.price ?? safeItem.price ?? 0)

    const addOnsPrice = (selectedAddOns || []).reduce(
      (sum, addon) => sum + (Number(addon.price) || 0),
      0
    )

    return (basePrice + addOnsPrice + modifiersTotal) * quantity
  }

  const validateModifiers = () => {
    for (const mod of modifiers) {
      const group = mod.group_id || mod.name
      const required = !!mod.required

      const sel = selectedModifiers[group] || []

      if (required && sel.length === 0) {
        toast.error(`Please choose an option for "${group}"`)
        return false
      }
const min = Number(mod.min ?? mod.min_select ?? mod.min_qty ?? 0)
const max = Number(mod.max ?? mod.max_select ?? mod.max_qty ?? 0)

const isRadio = min === 1 && max === 1
const mode = isRadio ? "single" : "multi"

      if (min > 0 && sel.length < min) {
        toast.error(`Please select at least ${min} options for "${group}"`)
        return false
      }

      if (max > 0 && sel.length > max) {
        toast.error(`You can select max ${max} options for "${group}"`)
        return false
      }
    }
    return true
  }

  const handleAddToCartClick = () => {
    if (!validateModifiers()) return

    onAddToCart(
      {
        ...safeItem,
        selectedModifiers: selectedModifierObjects,
        selectedAddOns,
        selectedVariant,
        specialInstructions
      },
      quantity,
      selectedVariant,
      selectedAddOns,
      specialInstructions
    )

    toast.success(`${safeItem.name} added to cart`)
    onClose()
  }

  // ✅ safe return
  if (!isOpen || !item) return null

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-2 sm:px-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b px-4 sm:px-6 py-3 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold">Item Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Item Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="w-full md:w-52 shrink-0">
              <img
                src={safeItem.image || "/placeholder.svg"}
                alt={safeItem.name}
                className="w-full h-40 md:h-36 object-cover rounded-xl shadow-sm"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-lg sm:text-2xl font-semibold mb-2">
                {safeItem.name}
              </h3>

              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                {safeItem.description || "No description available."}
              </p>
            </div>
          </div>

          {/* ✅ MODIFIERS / CUSTOMIZATIONS */}
          {modifiers.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Customize</h4>

              {modifiers.map(mod => {
                const group = mod.group_id || mod.name
                const required = !!mod.required
                // const min = Number(mod.min ?? 0)
const min = Number(mod.min ?? 0)
const max = Number(mod.max ?? 0)

// ✅ RULE:
// radio only when exactly 1 required selection
const isRadio = min === 1 && max === 1
const mode = isRadio ? "single" : "multi"

console.log("MOD GROUP:", mod.name, mod.min, mod.max, mod)


                const selected = selectedModifiers[group] || []

                return (
                  <div
                    key={group}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm text-gray-900">
                          {mod.name || group}
                        </h5>

                        {required && (
                          <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full">
                            REQUIRED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 font-medium">
  {mode === "single"
    ? "Choose 1"
    : max > 0
    ? `Choose up to ${max}`
    : "Choose any"}
</div>

                    </div>

                    <div className="space-y-2">
                      {(mod.options || []).map(opt => {
                        const optId = opt.option_id || opt.name
                        const isSelected = selected.includes(optId)
                        const optPrice = Number(opt.price ?? 0)

                        return (
                          <label
                            key={optId}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={mode === "multi" ? "checkbox" : "radio"}
                                name={group}
                                checked={isSelected}
                                onChange={() =>
                                  setModifierValue(group, optId, mode)
                                }
                                className="text-orange-500"
                              />
                              <span className="text-sm font-medium">
                                {opt.name}
                              </span>
                            </div>

                            <span className="text-sm font-bold text-gray-900">
                              {optPrice > 0
                                ? `+ ${formatPriceAUD(optPrice)}`
                                : "Free"}
                            </span>
                          </label>
                        )
                      })}
                      
                    </div>
                  </div>
                )
              
              console.log("MOD GROUP:", mod.name, mod.min, mod.max, mod)

              })}
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
              placeholder="Any special requests?"
              className="w-full p-3 border rounded-lg resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-t pt-4">
            <div className="flex items-center gap-3">
              <span className="font-medium text-sm sm:text-base">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
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

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeInOverlay 0.2s ease-out; }
        .animate-slideUp { animation: slideUpModal 0.25s ease-out; }
      `}</style>
    </div>
  )
}
