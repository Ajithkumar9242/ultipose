// ../components/CartSidebar.jsx
"use client"
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPriceAUD } from "../utils/currency"

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
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
               <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Order</h2>
                <p className="text-xs text-gray-500 font-medium">{cartItems.length} Items</p>
            </div>
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

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                 <Utensils className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
              <p className="text-gray-500 text-sm max-w-[200px]">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Button variant="outline" onClick={onClose} className="mt-4 border-orange-200 text-orange-600 hover:bg-orange-50">
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item, index) => {
                const basePrice = item.selectedVariant?.price || item.price
                const addOnsPrice = (item.selectedAddOns || []).reduce(
                  (sum, addon) => sum + addon.price,
                  0
                )
                const itemTotal = (basePrice + addOnsPrice) * item.quantity

                return (
                  <div 
                    key={item.id} 
                    className="group relative flex gap-4 animate-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Item Details */}
                    <div className="flex-1 pb-6 border-b border-dashed border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-2 pr-4">
                           {/* Veg Indicator */}
                          <div className="mt-1 flex-shrink-0">
                             <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded-[3px] ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                                <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                             </div>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</h4>
                            <p className="text-sm font-semibold text-gray-900">{formatPriceAUD(itemTotal)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Variants & Addons */}
                      <div className="pl-6 space-y-1 mb-3">
                         {item.selectedVariant && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 w-fit px-2 py-0.5 rounded-md">
                                <span className="font-medium">Size:</span> {item.selectedVariant.name}
                            </div>
                         )}
                         {item.selectedAddOns.length > 0 && (
                           <p className="text-xs text-gray-500 leading-relaxed">
                             <span className="font-medium text-gray-600">Add-ons:</span>{" "}
                             {item.selectedAddOns.map(addon => addon.name).join(", ")}
                           </p>
                         )}
                         {item.specialInstructions && (
                           <p className="text-xs text-orange-600 italic bg-orange-50/50 p-1.5 rounded mt-1 border border-orange-100">
                             "{item.specialInstructions}"
                           </p>
                         )}
                      </div>

                      {/* Action Row */}
                      <div className="pl-6 flex items-center justify-between">
                        {/* Modern Stepper */}
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <button
                            onClick={() => {
                                if (item.quantity <= 1) {
                                  onRemoveItem(item.id)
                                } else {
                                  onUpdateQuantity(item.id, item.quantity - 1)
                                }
                              }}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                          
                          <button
                             onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                             className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
          {cartItems.length > 0 ? (
            <>
              {/* Bill Summary Look */}
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Amount</p>
                    <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        {formatPriceAUD(total)}
                    </span>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-400">Incl. taxes</p>
                 </div>
              </div>
              
              <Button
                onClick={onCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-14 rounded-xl text-base font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between px-6"
              >
                <span>Proceed to Checkout</span>
                <div className="bg-white/20 p-1.5 rounded-lg">
                    <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </>
          ) : (
            <Button
              disabled
              className="w-full h-12 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed font-medium"
            >
              Cart is Empty
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}