// ../components/MenuCategorySidebar.jsx
"use client"

import { ChevronRight } from "lucide-react"

export function MenuCategorySidebar({
  menuCategories,
  selectedCategory,
  onSelectCategory
}) {
  return (
    <aside
      className="
        hidden lg:flex flex-col
        w-72 pr-6 py-6
        sticky top-[90px] self-start
        max-h-[calc(100vh-90px)]
      "
    >
      {/* Premium Header */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">
          Menu Categories
        </h3>
      </div>

      {/* Scrollable List with invisible scrollbar aesthetic */}
      <nav className="space-y-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {menuCategories.map((category, index) => {
          const isSelected = selectedCategory === category

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`
                group relative w-full flex items-center justify-between
                px-4 py-3.5 text-sm font-medium rounded-xl
                transition-all duration-300 ease-out
                ${
                  isSelected
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 scale-[1.02]"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600 bg-transparent"
                }
              `}
            >
              <span className="relative z-10 truncate">{category}</span>

              {/* Animated Icon Indicator */}
              <ChevronRight
                className={`
                  w-4 h-4 transition-all duration-300
                  ${
                    isSelected
                      ? "opacity-100 translate-x-0 text-orange-100"
                      : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-orange-400"
                  }
                `}
              />

              {/* Subtle background glow for inactive hover */}
              {!isSelected && (
                <div className="absolute inset-0 rounded-xl bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          )
        })}
      </nav>

      {/* CSS for hiding scrollbar but keeping functionality if list is long */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #fed7aa; /* orange-200 */
          border-radius: 20px;
        }
      `}</style>
    </aside>
  )
}