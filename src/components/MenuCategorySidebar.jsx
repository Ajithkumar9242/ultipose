// ../components/MenuCategorySidebar.jsx
"use client"

export function MenuCategorySidebar({
  menuCategories,
  selectedCategory,
  onSelectCategory
}) {
  return (
    <aside
      className="
        hidden lg:block
        w-64 border-r border-gray-200 p-6
        sticky top-[96px] self-start
        max-h-[calc(100vh-96px)] overflow-y-auto
      "
    >
      <nav className="space-y-1">
        {menuCategories.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
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
    </aside>
  )
}
