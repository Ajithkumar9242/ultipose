"use client"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPriceAUD } from "../utils/currency"   // ⬅️ ADD THIS

export function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  total
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Cart ({cartItems.length})</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => {
                const basePrice = item.selectedVariant?.price || item.price
                const addOnsPrice = (item.selectedAddOns || []).reduce(
                  (sum, addon) => sum + addon.price,
                  0
                )

                const itemTotal = (basePrice + addOnsPrice) * item.quantity

                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-3 h-3 border flex items-center justify-center ${
                              item.isVeg
                                ? "border-green-500"
                                : "border-red-500"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVeg
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                          </div>
                          <h4 className="font-medium">{item.name}</h4>
                        </div>

                        {item.selectedVariant && (
                          <p className="text-sm text-gray-600">
                            Size: {item.selectedVariant.name}
                          </p>
                        )}

                        {item.selectedAddOns.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Add-ons:{" "}
                            {item.selectedAddOns
                              .map(addon => addon.name)
                              .join(", ")}
                          </p>
                        )}

                        {item.specialInstructions && (
                          <p className="text-sm text-gray-600">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              onRemoveItem(item.id)
                            } else {
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>

                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-semibold">
                        {formatPriceAUD(itemTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer always sticks to bottom */}
        <div className="border-t p-4">
          {cartItems.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">
                  Total: {formatPriceAUD(total)}
                </span>
              </div>
              <Button
                onClick={onCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                Proceed to Checkout
              </Button>
            </>
          ) : (
            <Button
              disabled
              className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              Cart is Empty
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
