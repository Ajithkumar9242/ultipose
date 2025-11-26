// ../components/MenuTopBar.jsx
"use client"

import { useState } from "react"
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  SlidersHorizontal,
  Leaf
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterPanel } from "./FilterPanel"
import { DeliverySelector } from "./DeliverySelector "

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
  onOpenCart,
  storeInfo // store meta from API
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // derive values from storeInfo with fallback
  const storeName = storeInfo?.name || "Restaurant"
  const storeCode = storeInfo?.code || "Store code"
  const storePhone = storeInfo?.phoneNo
  const logoLetter = storeName.charAt(0).toUpperCase()

  return (
    <>
      {/* Header (top bar) - Glassmorphism Effect */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 py-3 lg:px-8 lg:py-4">
          
          {/* Row 1: Logo, Menu, Cart (Mobile) */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden mr-3">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-orange-50 text-gray-700"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>

            {/* Logo and Restaurant Info */}
            <div className="flex items-center gap-3 flex-1 lg:flex-none">
              <div className="w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center shadow-inner border border-orange-100/50">
                <span className="text-orange-600 font-extrabold text-lg lg:text-xl">
                  {logoLetter}
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-base lg:text-lg font-bold text-gray-900 leading-tight tracking-tight">
                  {storeName}
                </h1>
                <p className="text-[10px] lg:text-xs text-gray-500 font-medium">
                  {storeCode}
                  {storePhone ? ` • ${storePhone}` : ""}
                </p>
              </div>
            </div>

            {/* Mobile Cart Icon (Visible on mobile only for easy access) */}
            <div className="lg:hidden ml-2">
               <Button
                  onClick={onOpenCart}
                  size="icon"
                  className="relative bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 shadow-md shadow-orange-200"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>
            </div>
          </div>

          {/* Desktop Search Bar - Centered & Premium Pill Shape */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8 transition-all duration-300 group focus-within:max-w-xl">
            <div className="relative w-full">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                 <Search className="w-4 h-4" />
              </div>
              <Input
                placeholder="Search for delicious items..."
                className="pl-11 h-11 bg-gray-50/80 border-transparent hover:bg-gray-100 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50 rounded-full text-sm transition-all duration-300 shadow-sm"
                value={filters.searchQuery}
                onChange={e =>
                  setFilters({ ...filters, searchQuery: e.target.value })
                }
              />
            </div>
          </div>

          {/* Right-side controls (Desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Filter Panel */}
            <div className="border-r border-gray-200 pr-4">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />
            </div>

            {/* Custom Veg Toggle */}
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setVegOnly(!vegOnly)}
            >
              <div className={`
                relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out border
                ${vegOnly ? "bg-green-100 border-green-200" : "bg-gray-100 border-gray-200 group-hover:bg-gray-200"}
              `}>
                <div className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center
                  ${vegOnly ? "translate-x-5" : "translate-x-0.5"}
                `}>
                   {vegOnly ? <Leaf className="w-3 h-3 text-green-600 fill-green-600" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                </div>
              </div>
              <span className={`text-sm font-medium transition-colors ${vegOnly ? "text-green-700" : "text-gray-500"}`}>
                Veg Only
              </span>
            </div>

            {/* Desktop Cart Button */}
            <Button
              onClick={onOpenCart}
              className="relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 h-10 rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="font-semibold tracking-wide text-sm">Cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </div>

          {/* Mobile Search & Filter Row */}
          <div className="mt-3 lg:hidden w-full flex items-center gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-10 bg-gray-50 border-gray-100 focus:bg-white focus:border-orange-300 rounded-xl text-sm"
                  value={filters.searchQuery}
                  onChange={e =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileFilterOpen(true)}
                className="h-10 w-10 border-gray-200 rounded-xl bg-white text-gray-700"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
          </div>
        </div>
      </header>

      {/* Spacing adjustments for fixed header */}
      <div className="h-[140px] lg:h-[90px] w-full" />

      {/* Mobile Menu Overlay - Animated Slide In */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
             onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:bg-red-50 hover:text-red-500 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <nav className="p-4 space-y-1 overflow-y-auto flex-1">
              <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
              {menuCategories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 font-medium ${
                    selectedCategory === category
                      ? "bg-orange-50 text-orange-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet - Animated Slide Up */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
             onClick={() => setIsMobileFilterOpen(false)}
           />
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Filter & Sort</h3>
              <Button
                variant="ghost"
                size="icon"
                className="bg-gray-100 rounded-full"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
            />

            {/* Mobile Veg Toggle inside filters */}
            <div className="flex items-center justify-between py-4 border-t border-gray-100 mt-4">
                <span className="text-sm font-medium text-gray-700">Veg Only</span>
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setVegOnly(!vegOnly)}
                >
                  <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${vegOnly ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${vegOnly ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-xl text-base font-semibold shadow-lg shadow-orange-200"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                View Results
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Info Component */}
      <DeliverySelector />
    </>
  )
} 