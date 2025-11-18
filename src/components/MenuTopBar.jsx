// ../components/MenuTopBar.jsx
"use client"

import { useState } from "react"
import { Search, ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterPanel } from "./FilterPanel"
import { DeliverySelector } from "@/components/DeliverySelector "

export function MenuTopBar({
  filters,
  setFilters,
  vegOnly,
  setVegOnly,
  menuCategories,
  selectedCategory,
  setSelectedCategory,
  categories,
  cartItemsCount,
  onOpenCart
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Header (top bar) */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Logo and Restaurant Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-base lg:text-lg">
                R
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
                React Restaurant
              </h1>
              <p className="text-xs lg:text-sm text-gray-600">
                React Restaurant - BrookeField
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search for items..."
                className="pl-10 bg-gray-50 border-gray-200"
                value={filters.searchQuery}
                onChange={e =>
                  setFilters({ ...filters, searchQuery: e.target.value })
                }
              />
            </div>
          </div>

          {/* Right-side controls */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Filter Panel (desktop) */}
            <div className="hidden lg:block">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />
            </div>

            {/* Veg Only Toggle */}
            <div className="flex items-center space-x-2">
              <img
                src="/veg.png"
                alt="Veg"
                className="w-5 h-5 lg:w-6 lg:h-6"
              />
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`w-10 h-5 lg:w-12 lg:h-6 rounded-full transition-colors ${
                  vegOnly ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full transition-transform ${
                    vegOnly
                      ? "translate-x-5 lg:translate-x-6"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Cart Button */}
            <Button
              onClick={onOpenCart}
              className="relative bg-orange-500 hover:bg-orange-600 text-white px-3 lg:px-4"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for items..."
              className="pl-10 bg-gray-50 border-gray-200"
              value={filters.searchQuery}
              onChange={e =>
                setFilters({ ...filters, searchQuery: e.target.value })
              }
            />
          </div>
        </div>
      </header>
<div className="h-[120px] lg:h-[80px] w-full" />
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {menuCategories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedCategory === category
                      ? "bg-orange-50 text-orange-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Info (kept together with top bar as you asked) */}
      <DeliverySelector />
    </>
  )
}
