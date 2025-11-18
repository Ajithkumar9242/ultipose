"use client"
import { useState, useMemo, useEffect } from "react"
import { Search, MapPin, ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"

import { ItemDetailsModal } from "../components/ItemDetailsModal"
import { CartSidebar } from "../components/CartSidebar"
import { AuthModal } from "../components/AuthModal"
import { OrderPage } from "../components/OrderPage"
import { FilterPanel } from "../components/FilterPanel"
import { mapPosMenuToClient } from "../data/posMapper"
import { MenuCategorySidebar } from "../components/MenuCategorySidebar"
import { MenuTopBar } from "../components/MenuTopBar"  // ⬅️ NEW

import { useSelector, useDispatch } from "react-redux"
import { OrderConfirmation } from "../components/OrderConfirmation"
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setIsOpen
} from "../redux/store"

const POS_API_URL =
  "https://devapi.ulti-pos.com/ultipos-online/ultipos-test-store-1"

export default function Menuu() {
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

  const dispatch = useDispatch()
  const cartItems = useSelector(state => state.cart.items)
  const isCartOpen = useSelector(state => state.cart.isOpen)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(POS_API_URL)
        if (!res.ok) {
          throw new Error("Failed to fetch menu")
        }
        const data = await res.json()
        const mapped = mapPosMenuToClient(data)
        setFoodItems(mapped.foodItems)
        setMenuCategories(mapped.menuCategories)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load menu")
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [])

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
    toast.success(`${item.name} added to cart`)
  }

  const handleItemClick = item => {
    setSelectedItem(item)
  }

  const handleCheckout = () => {
    dispatch(setIsOpen(false))
    setIsAuthOpen(true)
  }

  const handleBackToHome = () => {
    setOrderConfirmation(null)
  }

  const handleAuthComplete = details => {
    setUserDetails(details)
    setShowOrderPage(true)
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

  if (orderConfirmation) {
    return (
      <OrderConfirmation
        orderDetails={orderConfirmation}
        onBackToHome={handleBackToHome}
      />
    )
  }

  if (showOrderPage && userDetails) {
    return (
      <OrderPage
        cartItems={cartItems}
        userDetails={userDetails}
        onBack={() => setShowOrderPage(false)}
        onPlaceOrder={handlePlaceOrder}
        total={getCartTotal()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 🔹 Top bar + mobile menu + DeliverySelector in one component */}
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
              {loading ? "Loading items..." : `${filteredItems.length} Items`}
            </p>
          </div>

          {!loading && (
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
                          ₹{item.price}
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
          )}
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
      />
    </div>
  )
}
