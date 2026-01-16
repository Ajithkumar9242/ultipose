// src/pages/Menuu.jsx
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "react-hot-toast"
import api from "@/api"
import { getFileUrl } from "@/utils/getFileUrl"
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
import { ShoppingBag, Plus, Sparkles, ChevronRight } from "lucide-react"
import FooterLinks from "@/components/FooterLinks"

export default function Menuu() {
  const { storeCode } = useParams()
  const outletCode = storeCode 
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const listRef = useRef(null)

  // ✅ if route param missing
  if (!outletCode) return <NotFound />

  // -------------------- STATE --------------------
  const [foodItems, setFoodItems] = useState([])
  const [menuCategories, setMenuCategories] = useState(["Menu"])
  const [selectedCategory, setSelectedCategory] = useState("Menu")
  const [vegOnly, setVegOnly] = useState(false)

  const [filters, setFilters] = useState({
    category: "",
    isVeg: null,
    priceRange: [0, 100000],
    rating: 0,
    searchQuery: ""
  })

  const [storeInfo, setStoreInfo] = useState(null)
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

        setStoreInfo({
          name: outletCode,
          code: outletCode
        })

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
              category: cat.category_name || cat.category_id || "Menu",
              customizations,
              customizable: customizations.length > 0,
              isVeg: i.isVeg ?? true,
              variants: i.variants || [],
              addOns: i.addOns || [],
              tags: i.tags || [],
              rating: i.rating || 4.5
            }
          })
        )

        setFoodItems(items)

        const categoryNames = [
          "Menu",
          ...(data.categories || [])
            .map(c => c.category_name)
            .filter(Boolean)
        ]

        setMenuCategories([...new Set(categoryNames)])
      } catch (err) {
        console.error("❌ MENU API ERROR:", err)
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

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <MenuTopBar
          storeInfo={storeInfo}
          filters={filters}
          setFilters={setFilters}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          menuCategories={menuCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={menuCategories}
          cartItemsCount={getCartItemsCount()}
          onOpenCart={() => dispatch(setIsOpen(true))}
        />
        
        {/* Mobile Horizontal Category Scroll (Replaces Sidebar on Mobile) */}
        <div className="md:hidden overflow-x-auto scrollbar-hide py-3 px-4 flex gap-2 border-t border-gray-100 bg-white">
            {menuCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 items-start">
        
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-32 transition-all">
          <MenuCategorySidebar
            menuCategories={menuCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </aside>

        {/* Main Grid */}
        <main className="flex-1 min-h-[60vh]">
          {/* Section Title */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {selectedCategory === "Menu" ? "All Items" : selectedCategory}
            </h2>
            <span className="text-sm text-gray-400 font-medium">
              {filteredItems.length} results
            </span>
          </div>

          <div 
            ref={listRef} 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
              >
                {/* Image Area */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.image ? getFileUrl(item.image) : "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    {item.customizable && (
                      <span className="bg-white/90 backdrop-blur text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles size={10} /> CUSTOMIZABLE
                      </span>
                    )}
                    {item.isVeg ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200">
                        VEG
                      </span>
                    ) : (
                       <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200">
                        NON-VEG
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed h-10">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer: Price + Action */}
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {formatPriceAUD(item.price)}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleAddButtonClick(item)}
                      size="sm"
                      className="rounded-full h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-95"
                    >
                      ADD
                      {item.customizable ? (
                         <ChevronRight size={16} className="ml-1 opacity-80" />
                      ) : (
                         <Plus size={16} className="ml-1 opacity-80" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-orange-50 p-6 rounded-full mb-4 animate-pulse">
                <ShoppingBag size={48} className="text-orange-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                We couldn't find anything matching your current filters. Try changing category or search terms.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-orange-200 text-orange-600 hover:bg-orange-50"
                onClick={() => {
                  setFilters({...filters, searchQuery: ""});
                  setVegOnly(false);
                  setSelectedCategory("Menu");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
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

      <FooterLinks outletCode={outletCode} />
      
      {/* Hide Scrollbar Style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}