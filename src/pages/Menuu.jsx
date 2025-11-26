// src/pages/Menuu.jsx
"use client"
import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { MenuSkeleton } from "../components/MenuSkeleton"
import { MenuSidebarSkeleton } from "../components/MenuSidebarSkeleton"
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

    
    <div className="min-h-screen bg-white">
      {showLocationPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm">
              We’d like to use your location to show delivery options for your area.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-400 text-gray-100"
                onClick={handleSkipLocation}
              >
                Not now
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleRequestLocation}
              >
                Allow location
              </Button>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex max-w-7xl mx-auto">
       
          <MenuCategorySidebar
            menuCategories={menuCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
 

        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
              {selectedCategory === "Menu" ? "All Items" : selectedCategory}
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              { `${filteredItems.length} Items`}
            </p>
          </div>

       
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <div className="mb-2">
                          <div
                            className={`w-4 h-4 border-2 flex items-center justify-center ${
                              item.isVeg ? "border-green-500" : "border-red-500"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.isVeg ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                          </div>
                        </div>

                        <h3
                          className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-orange-600 text-sm lg:text-base"
                          onClick={() => handleItemClick(item)}
                        >
                          {item.name}
                        </h3>
                        <p className="text-base lg:text-lg font-semibold text-gray-900 mb-3">
                          {formatPriceAUD(item.price)}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {(item.tags || []).slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-1 text-xs rounded-full ${
                                tag.includes("Chef") ||
                                tag.includes("Restaurant")
                                  ? "bg-blue-100 text-blue-600"
                                  : tag.includes("Spicy")
                                  ? "bg-red-100 text-red-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {item.customizable && (
                          <p className="text-xs text-gray-500">Customizable</p>
                        )}
                      </div>

                      <div className="relative">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-24 h-20 lg:w-32 lg:h-24 object-cover rounded-lg cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        />
                        <Button
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold px-4 lg:px-6 py-1 text-xs lg:text-sm"
                          variant="outline"
                          onClick={() => handleItemClick(item)}
                        >
                          ADD
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-base lg:text-lg">
                    No items found matching your criteria
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
                    className="mt-4"
                  >
                    Clear Filters
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
