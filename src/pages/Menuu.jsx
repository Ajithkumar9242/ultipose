// src/pages/Menuu.jsx
"use client"
import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { formatPriceAUD } from "../utils/currency"
import { setLocation } from "../redux/locationSlice"
import { setUserDetails as setUserDetailsRedux } from "../redux/userSlice"
import LoadingScreen from "../components/LoadingScreen"

import { ItemDetailsModal } from "../components/ItemDetailsModal"
import { CartSidebar } from "../components/CartSidebar"
import { AuthModal } from "../components/AuthModal"
import { mapPosMenuToClient } from "../data/posMapper"
import { MenuCategorySidebar } from "../components/MenuCategorySidebar"
import { MenuTopBar } from "../components/MenuTopBar"

import { useSelector, useDispatch } from "react-redux"
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setIsOpen,
  setCurrentStore
} from "../redux/store"

import NotFound from "./NotFound"
import api from "@/api"
import { ShoppingBag, Star, Plus, Flame, Clock } from "lucide-react"

// 🔹 BASE URL & default store from env
const DEFAULT_STORE_CODE = "ultipos-test-store-1"

export default function Menuu() {
  const { storeCode } = useParams()
  const effectiveStoreCode = storeCode || DEFAULT_STORE_CODE
  const POS_API_URL = `/ultipos-online/${effectiveStoreCode}`

  const [vegOnly, setVegOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [showOrderPage, setShowOrderPage] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState("Menu")
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  const [filters, setFilters] = useState({
    category: "",
    isVeg: null,
    priceRange: [0, 100000],
    rating: 0,
    searchQuery: ""
  })

  const [foodItems, setFoodItems] = useState([])
  const [menuCategories, setMenuCategories] = useState(["Menu"])
  const [loading, setLoading] = useState(true)
  const [storeNotFound, setStoreNotFound] = useState(false)

  const navigate = useNavigate()

  // store info for logo/name/id
  const [storeInfo, setStoreInfo] = useState(null)

  // location banner
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)

  const dispatch = useDispatch()

  const cartItems = useSelector(state => {
    const currentStore = state.cart.currentStore
    if (!currentStore) return []
    return state.cart.byStore[currentStore] || []
  })

  const isCartOpen = useSelector(state => state.cart.isOpen)
  const location = useSelector(state => state.location)

  // 🔹 PER-STORE saved user
  const savedUser = useSelector(state => {
    const byStore = state.user.byStore || {}
    return byStore[effectiveStoreCode] || null
  })

  // Show location banner if no location yet
  useEffect(() => {
    if (!location?.data) {
      setShowLocationPrompt(true)
    }
  }, [location?.data])

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.display_name

          dispatch(
            setLocation({
              type: "delivery",
              data: address
            })
          )
          setShowLocationPrompt(false)
        } catch (err) {
          console.error("Error reverse geocoding:", err)
          toast.error("Couldn't fetch your address.")
        }
      },
      error => {
        console.log("Location denied or failed:", error)
        toast.error(
          "Location access was blocked. Please allow location in your browser settings and try again."
        )
      }
    )
  }

  const handleSkipLocation = () => {
    setShowLocationPrompt(false)
  }

  // set current store in Redux
  useEffect(() => {
    dispatch(setCurrentStore(effectiveStoreCode))
  }, [effectiveStoreCode, dispatch])

  // Fetch menu + store info with simple cache
  useEffect(() => {
    const cacheKey = `menu-cache:${effectiveStoreCode}`

    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setFoodItems(parsed.foodItems || [])
        setMenuCategories(parsed.menuCategories || ["Menu"])
        setStoreInfo(parsed.storeInfo || null)
        setLoading(false)
      } catch (e) {
        console.error("Failed to parse cached menu", e)
      }
    }

    const fetchMenu = async () => {
      try {
        if (!cached) {
          setLoading(true)
        }
        setStoreNotFound(false)

        const res = await api.get(POS_API_URL)
        console.log("Result", res)

        if (res.status === 404) {
          setStoreNotFound(true)
          setFoodItems([])
          setMenuCategories(["Menu"])
          setStoreInfo(null)
          return
        }

        const data = res.data
        const mapped = mapPosMenuToClient(data)

        setStoreInfo(data.store || null)
        setFoodItems(mapped.foodItems)
        setMenuCategories(mapped.menuCategories)

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            foodItems: mapped.foodItems,
            menuCategories: mapped.menuCategories,
            storeInfo: data.store || null
          })
        )
      } catch (err) {
        console.error(err)
        toast.error("Failed to load menu")
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [POS_API_URL, effectiveStoreCode])

  const getCartItemsCount = () =>
    cartItems.reduce((total, item) => total + (item.quantity || 1), 0)

  const getCartTotal = () =>
    cartItems.reduce((total, item) => {
      const basePrice = item.selectedVariant?.price || item.price
      const addOnsPrice = (item.selectedAddOns || []).reduce(
        (sum, addon) => sum + addon.price,
        0
      )
      return total + (basePrice + addOnsPrice) * (item.quantity || 1)
    }, 0)

  const filteredItems = useMemo(() => {
    return foodItems.filter(item => {
      if (vegOnly && !item.isVeg) return false
      if (filters.category && item.category !== filters.category) return false
      if (selectedCategory !== "Menu" && item.category !== selectedCategory)
        return false
      if (filters.isVeg !== null && item.isVeg !== filters.isVeg) return false
      if (
        item.price < filters.priceRange[0] ||
        item.price > filters.priceRange[1]
      )
        return false
      if (item.rating < filters.rating) return false
      if (
        filters.searchQuery &&
        !item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      )
        return false
      return true
    })
  }, [foodItems, vegOnly, filters, selectedCategory])

  const handleAddToCart = (
    item,
    quantity = 1,
    selectedVariant,
    selectedAddOns = [],
    specialInstructions
  ) => {
    dispatch(
      addItem({
        ...item,
        quantity,
        selectedVariant,
        selectedAddOns,
        specialInstructions
      })
    )
  }

  const handleItemClick = item => {
    setSelectedItem(item)
  }

  const handleCheckout = () => {
    dispatch(setIsOpen(false))

    // ✅ savedUser is per-store now
    if (savedUser && savedUser.email && savedUser.phone) {
      setUserDetails(savedUser)
      setShowOrderPage(true)
      navigate("/checkout")
    } else {
      setIsAuthOpen(true)
    }
  }

  const handleBackToHome = () => {
    setOrderConfirmation(null)
  }

  const handleAuthComplete = details => {
    // { name, email, phone } for THIS store only
    setUserDetails(details)
    dispatch(
      setUserDetailsRedux({
        storeCode: effectiveStoreCode,
        details
      })
    )
    setIsAuthOpen(false)
    navigate("/checkout")
  }

  const handlePlaceOrder = orderDetails => {
    const completeOrderDetails = {
      ...orderDetails,
      orderTime: new Date().toLocaleString(),
      status: "confirmed"
    }
    setOrderConfirmation(completeOrderDetails)
    dispatch(clearCart())
    setShowOrderPage(false)
    setUserDetails(null)
    toast.success(`Order placed successfully! ID: ${orderDetails.orderId}`)
    localStorage.removeItem("preparationInstructions")
  }

  const categories = [...new Set(foodItems.map(item => item.category))]

  if (loading) {
    return <LoadingScreen />
  }

  if (storeNotFound) {
    return <NotFound />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/50">
      
      {/* 🔹 CSS for custom animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>

      {/* Location Banner */}
      {showLocationPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm font-medium flex items-center gap-2">
              📍 We’d like to use your location to show delivery options for your area.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={handleSkipLocation}
              >
                Not now
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-md"
                onClick={handleRequestLocation}
              >
                Allow location
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <MenuTopBar
        filters={filters}
        setFilters={setFilters}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
        menuCategories={menuCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        cartItemsCount={getCartItemsCount()}
        onOpenCart={() => dispatch(setIsOpen(true))}
        storeInfo={storeInfo}
      />

      <div className="flex max-w-7xl mx-auto pt-6 pb-20">
        {/* Sidebar Navigation */}
        <MenuCategorySidebar
          menuCategories={menuCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <main className="flex-1 px-4 lg:px-8">
          {/* Header Section */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-orange-100 pb-4 gap-2">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
                {selectedCategory === "Menu" ? "All Items" : selectedCategory}
              </h2>
              <p className="text-gray-500 font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400"></span>
                {filteredItems.length} delicious items available
              </p>
            </div>
          </div>

          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }} // Staggered delay logic
                  className="animate-fade-in-up group bg-white rounded-3xl p-4 sm:p-5 border border-transparent shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.15)] hover:border-orange-100/50 hover:-translate-y-1 transition-all duration-300 relative overflow-visible"
                >
                  <div className="flex justify-between items-start gap-4 h-full">
                    
                    {/* Left: Content */}
                    <div className="flex-1 min-w-0 flex flex-col h-full">
                      <div className="mb-2 flex items-center gap-2">
                        {/* Veg/Non-Veg Indicator */}
                        <div
                          className={`w-4 h-4 border-2 flex items-center justify-center rounded-[4px] ${
                            item.isVeg ? "border-green-600" : "border-red-600"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.isVeg ? "bg-green-600" : "bg-red-600"
                            }`}
                          />
                        </div>
                        {item.tags?.includes("Bestseller") && (
                             <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3 fill-orange-600" /> Bestseller
                             </span>
                        )}
                      </div>

                      <h3
                        className="text-lg sm:text-xl font-bold text-gray-800 mb-1 cursor-pointer group-hover:text-orange-600 transition-colors leading-snug"
                        onClick={() => handleItemClick(item)}
                      >
                        {item.name}
                      </h3>

                      <p className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2">
                        {formatPriceAUD(item.price)}
                      </p>

                      {/* Description truncate */}
                      {item.description && (
                         <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                            {item.description}
                         </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-auto">
                        {(item.tags || []).slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-gray-50 text-gray-500 border border-gray-100 group-hover:border-orange-100 group-hover:bg-orange-50/50 group-hover:text-orange-600 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Image & Action */}
                    <div className="relative flex-shrink-0 self-start">
                      <div 
                        className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden cursor-pointer shadow-sm relative z-0"
                        onClick={() => handleItemClick(item)}
                      >
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
                        />
                         {/* Gradient overlay for better text contrast if needed, mostly aesthetic here */}
                         <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      </div>
                      
                      {/* Floating Add Button */}
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-28 z-10">
                        <Button
                          className="w-full bg-white text-orange-600 hover:text-white hover:bg-orange-500 border border-orange-100 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30 font-bold text-sm h-10 rounded-xl uppercase tracking-wider transition-all duration-300 ease-out active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                        >
                          ADD <Plus className="w-4 h-4 ml-1 stroke-[3px]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customizability Badge Absolute */}
                  {item.customizable && (
                    <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            Customizable
                        </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 animate-fade-in-up">
                <div className="bg-orange-50 p-6 rounded-full mb-4">
                     <ShoppingBag className="w-12 h-12 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500 text-center max-w-sm mb-6">
                  We couldn't find anything matching your current filters. Try adjusting your search or categories.
                </p>
                <Button
                  onClick={() => {
                    setFilters({
                      category: "",
                      isVeg: null,
                      priceRange: [0, 100000],
                      rating: 0,
                      searchQuery: ""
                    })
                    setVegOnly(false)
                  }}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50 px-8"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </>
        </main>
      </div>

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
        onUpdateQuantity={(id, quantity) =>
          dispatch(updateQuantity({ id, quantity }))
        }
        onRemoveItem={id => dispatch(removeItem(id))}
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