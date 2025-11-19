// data/posMapper.js

// Better veg / non-veg detection
const inferIsVeg = (name = "") => {
  const lower = name.toLowerCase()

  // Explicit non-veg keywords
  const nonVegKeywords = [
    "chicken",
    "meat",
    "fish",
    "lamb",
    "beef",
    "prawn",
    "prawns",
    "shrimp",
    "bacon",
    "ham",
    "pepperoni",
    "salami",
    "mutton",
    "pork",
    "turkey"
  ]
  if (nonVegKeywords.some(k => lower.includes(k))) return false

  // If it clearly says veg/vegetarian etc we treat as veg – rest also default to veg
  const vegKeywords = ["veg ", "vege", "vegetarian", "paneer", "aloo", "margherita"]
  if (vegKeywords.some(k => lower.includes(k))) return true

  // If we don't see any non-veg word, we assume veg
  return true
}

// Main mapper: takes full POS response and returns { foodItems, menuCategories }
export const mapPosMenuToClient = (menuData) => {
  if (!menuData) return { foodItems: [], menuCategories: ["Menu"] }

  const allMenus = menuData.menus || []

  const foodItems = allMenus.flatMap(menu =>
    (menu.categories || []).flatMap(category =>
      (category.items || []).map(item => {
        const modifierGroups = item.modifierGroups || []

        // Treat ALL modifier options as add-ons
        const addOns = modifierGroups.flatMap(group =>
          (group.options || []).map(opt => ({
            id: opt._id,
            name: opt.name,
            price: opt.price || 0,
            isVeg: true // POS doesn’t send veg/non-veg per addon
          }))
        )

        return {
          id: item._id,
          name: item.name,
          price: item.price || 0,
          category: category.name,

          // fallback UI fields
          image: "/placeholder.svg",
          description: "",
          ingredients: [],
          tags: [],
          isVeg: inferIsVeg(item.name),
          customizable: modifierGroups.length > 0,
          rating: 0,
          preparationTime: "",
          serves: 1,
          variants: [],

          addOns,

          _raw: { menuId: menu._id, categoryId: category._id, item }
        }
      })
    )
  )

  const categoryNames = Array.from(
    new Set(
      allMenus.flatMap(menu =>
        (menu.categories || []).map(c => c.name)
      )
    )
  )

  // ❌ NO "Recommended" anymore, only "Menu" + real categories
  const menuCategories = ["Menu", ...categoryNames]

  return { foodItems, menuCategories }
}
