// src/pages/Menuu.jsx
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "react-hot-toast"
import api from "@/api"

import { Button } from "@/components/ui/button"
import LoadingScreen from "../components/LoadingScreen"
import NotFound from "./NotFound"

import { ItemDetailsModal } from "../components/ItemDetailsModal"
import { CartSidebar } from "../components/CartSidebar"
import { AuthModal } from "../components/AuthModal"
import { MenuCategorySidebar } from "../components/MenuCategorySidebar"
import { MenuTopBar } from "../components/MenuTopBar"

import {
  addItem,
  removeItem,
  updateQuantity,
  setIsOpen,
  setCurrentStore
} from "../redux/store"

import { setUserDetails as setUserDetailsRedux } from "../redux/userSlice"
import { formatPriceAUD } from "../utils/currency"
import { ShoppingBag, Plus } from "lucide-react"

// ✅ Default outlet
const DEFAULT_OUTLET_CODE = "ultipos-main"

export default function Menuu() {
  const { storeCode } = useParams()
  const outletCode = storeCode || DEFAULT_OUTLET_CODE

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const listRef = useRef(null)

  // -------------------- STATE --------------------
  const [foodItems, setFoodItems] = useState([])
  const [menuCategories, setMenuCategories] = useState(["Menu"])
  const [selectedCategory, setSelectedCategory] = useState("Menu")
  const [vegOnly, setVegOnly] = useState(false)

  // ✅ IMPORTANT: keep full filters object shape
  const [filters, setFilters] = useState({
    category: "",
    isVeg: null,
    priceRange: [0, 100000],
    rating: 0,
    searchQuery: ""
  })

  const [loading, setLoading] = useState(true)
  const [storeNotFound, setStoreNotFound] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // -------------------- REDUX --------------------
  const cartItems = useSelector(state => {
    const store = state.cart.currentStore
    return store ? state.cart.byStore[store] || [] : []
  })

  const isCartOpen = useSelector(state => state.cart.isOpen)

  const savedUser = useSelector(state => {
    const byStore = state.user.byStore || {}
    return byStore[outletCode] || null
  })

  // -------------------- INIT --------------------
  useEffect(() => {
    dispatch(setCurrentStore(outletCode))
  }, [outletCode, dispatch])

  // -------------------- LOAD MENU --------------------
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true)
        setStoreNotFound(false)

        const res = await api.get("/api/method/ultipos.api.menu.get_menu", {
          params: { outlet_code: outletCode }
        })

        const data = res?.data?.message

        if (!data || !Array.isArray(data.categories)) {
          setStoreNotFound(true)
          return
        }

        // ✅ flatten items from API
        const items = (data.categories || []).flatMap(cat =>
          (cat.items || []).map(i => {
            const customizations = Array.isArray(i.customizations)
              ? i.customizations
              : []

            return {
              id: i.item_id,
              name: i.name,
              price: Number(i.price || 0),
              image: i.image || "",
              description: i.description || "",

              // ✅ category should be category_name (for sidebar)
              category: cat.category_name || cat.category_id || "Menu",

              // ✅ backend returns customizations
              customizations,

              // ✅ IMPORTANT
              customizable: customizations.length > 0,

              // optional safe extras
              isVeg: i.isVeg ?? true,
              variants: i.variants || [],
              addOns: i.addOns || [],
              tags: i.tags || [],
              rating: i.rating || 4.5
            }
          })
        )

        setFoodItems(items)

        // ✅ sidebar categories
        const categoryNames = [
          "Menu",
          ...data.categories.map(c => c.category_name).filter(Boolean)
        ]

        setMenuCategories([...new Set(categoryNames)])
      } catch (err) {
        console.error(err)
        toast.error("Failed to load menu")
        setStoreNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [outletCode])

  // -------------------- FILTER --------------------
  const filteredItems = useMemo(() => {
    return foodItems.filter(item => {
      if (vegOnly && !item.isVeg) return false

      if (selectedCategory !== "Menu" && item.category !== selectedCategory) {
        return false
      }

      if (
        filters.searchQuery &&
        !item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false
      }

      return true
    })
  }, [foodItems, vegOnly, filters.searchQuery, selectedCategory])

  // -------------------- CART HELPERS --------------------
  const getCartItemsCount = () =>
    cartItems.reduce((t, i) => t + (i.quantity || 1), 0)

  const getCartTotal = () =>
    cartItems.reduce((t, i) => {
      const base = Number(i.selectedVariant?.price ?? i.price ?? 0)

      const addOnsPrice = (i.selectedAddOns || []).reduce(
        (sum, addon) => sum + Number(addon.price || 0),
        0
      )

      const modsPrice = (i.selectedModifiers || []).reduce(
        (sum, m) => sum + Number(m.price || 0),
        0
      )

      return t + (base + addOnsPrice + modsPrice) * (i.quantity || 1)
    }, 0)

  // ✅ if customizable => open modal, else direct add
  const handleAddButtonClick = item => {
    if (item.customizable) {
      setSelectedItem(item)
      return
    }

    dispatch(
      addItem({
        ...item,
        quantity: 1,
        selectedVariant: null,
        selectedAddOns: [],
        selectedModifiers: [],
        specialInstructions: ""
      })
    )

    toast.success(`${item.name} added`)
  }

  const handleCheckout = () => {
    dispatch(setIsOpen(false))
    if (savedUser?.email && savedUser?.phone) {
      navigate("/checkout")
    } else {
      setIsAuthOpen(true)
    }
  }

  const handleAuthComplete = details => {
    dispatch(
      setUserDetailsRedux({
        storeCode: outletCode,
        details
      })
    )
    setIsAuthOpen(false)
    navigate("/checkout")
  }

  // ✅ CALLED FROM MODAL (this is important)
  const handleAddToCart = (
    item,
    quantity = 1,
    selectedVariant,
    selectedAddOns = [],
    specialInstructions = ""
  ) => {
    dispatch(
      addItem({
        ...item,
        quantity,
        selectedVariant,
        selectedAddOns,
        specialInstructions,
        selectedModifiers: item.selectedModifiers || []
      })
    )
  }

  // -------------------- UI STATES --------------------
  if (loading) return <LoadingScreen />
  if (storeNotFound) return <NotFound />

  // -------------------- RENDER --------------------
  return (
    <div className="min-h-screen bg-orange-50">
      <MenuTopBar
        filters={filters}
        setFilters={setFilters}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
        menuCategories={menuCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        cartItemsCount={getCartItemsCount()}
        onOpenCart={() => dispatch(setIsOpen(true))}
      />

      <div className="flex max-w-7xl mx-auto pt-6 pb-24">
        <MenuCategorySidebar
          menuCategories={menuCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <main className="flex-1 px-4">
          <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition"
              >
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                />

                <h3 className="font-bold text-lg">{item.name}</h3>

                {item.description && (
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold">{formatPriceAUD(item.price)}</span>

                  <Button
                    onClick={() => handleAddButtonClick(item)}
                    className="bg-orange-500 text-white"
                  >
                    ADD <Plus size={14} className="ml-1" />
                  </Button>
                </div>

                {item.customizable && (
                  <p className="text-[11px] text-orange-600 font-semibold mt-2">
                    Customizable
                  </p>
                )}
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <ShoppingBag size={48} className="mx-auto mb-4" />
              No items found
            </div>
          )}
        </main>
      </div>

      {/* ✅ MODAL */}
      <ItemDetailsModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => dispatch(setIsOpen(false))}
        cartItems={cartItems}
        onUpdateQuantity={(cartKey, quantity) =>
          dispatch(updateQuantity({ cartKey, quantity }))
        }
        onRemoveItem={cartKey => dispatch(removeItem(cartKey))}
        onCheckout={handleCheckout}
        total={getCartTotal()}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthComplete={handleAuthComplete}
        initialDetails={savedUser}
      />
    </div>
  )
}
