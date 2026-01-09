// ../components/FilterPanel.jsx
"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ChevronDown, SlidersHorizontal, RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FilterPanel({ filters, onFiltersChange, categories = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleReset = () => {
    onFiltersChange({
      category: "",
      isVeg: null,
      priceRange: [null, null],
      rating: 0,
      searchQuery: ""
    })
  }

  const filterModalContent = (
    <div className="fixed inset-0 z-[100] flex justify-end isolate font-sans">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-white/20">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filters & Sort</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Refine your search results</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-9 w-9 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-white">

          {/* Search */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search item name..."
                value={filters.searchQuery}
                onChange={e => handleFilterChange("searchQuery", e.target.value)}
                className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 rounded-xl h-11 transition-all"
              />
            </div>
          </div>

          {/* Food Type */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preference</label>
            <div className="grid grid-cols-3 bg-gray-100 p-1.5 rounded-xl gap-1">
              {[
                { label: "All", value: null },
                { label: "Veg", value: true },
                { label: "Non-Veg", value: false }
              ].map(opt => {
                const isActive = filters.isVeg === opt.value
                return (
                  <button
                    key={String(opt.label)}
                    onClick={() => handleFilterChange("isVeg", opt.value)}
                    className={`
                      py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                      ${isActive
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}
                    `}
                  >
                    {opt.value === true && <div className="w-2 h-2 rounded-full bg-green-500" />}
                    {opt.value === false && <div className="w-2 h-2 rounded-full bg-red-500" />}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
            <div className="relative group">
              <select
                value={filters.category}
                onChange={e => handleFilterChange("category", e.target.value)}
                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent focus:border-orange-500 text-gray-800 font-semibold py-3.5 px-4 pr-10 rounded-xl outline-none transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>

                {/* ✅ Safe */}
                {(categories || []).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
          >
            Show Results
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-full transition-all"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">Filters</span>
      </Button>

      {isOpen && mounted && createPortal(filterModalContent, document.body)}
    </>
  )
}
