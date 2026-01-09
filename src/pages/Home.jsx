import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { setLocation } from "../redux/locationSlice"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  Bike,
  ShoppingBag,
  X
} from "lucide-react"
// import restaurantData from "../data/restaurant.js"
const OUTLET_CODE = "ultipos-main"
import api from "@/api"


// --- UI COMPONENTS ---
const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button"
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
  const variants = {
    primary:
      "bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200",
    outline:
      "border-2 border-gray-200 hover:border-orange-600 hover:text-orange-600 bg-white text-gray-700",
    ghost: "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

const Input = props => (
  <input
    {...props}
    className={
      "w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all " +
      (props.className || "")
    }
  />
)

// --- MAIN COMPONENT ---
const Home = () => {
  const [isLocationModalOpen, setLocationModalOpen] = useState(false)
  const [serviceType, setServiceType] = useState("delivery")
  const [manualFormVisible, setManualFormVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const [store, setStore] = useState(null)
const [loadingStore, setLoadingStore] = useState(true)


  const [manualAddress, setManualAddress] = useState({
    name: "",
    street: "",
    city: "",
    zip: ""
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // preview for map / confirmation
  const [previewCoords, setPreviewCoords] = useState(null) // { lat, lon }
  const [previewAddress, setPreviewAddress] = useState("")
  const [pendingUserDetails, setPendingUserDetails] = useState(null)

  // 🌍 Read global homepage location from Redux
  const globalLocation = useSelector(state => state.location?.global)

  const storedLocation = globalLocation?.address
  const hasLocation =
    !!globalLocation &&
    !!globalLocation.address &&
    !!globalLocation.coords &&
    globalLocation.coords.lat != null &&
    globalLocation.coords.lon != null

  // On first load: if no location stored, force open modal
  useEffect(() => {
    if (!storedLocation) {
      setLocationModalOpen(true)
    }
  }, [storedLocation])

  // Geocode (string → coords)
  const getCoordinatesFromAddress = async query => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        { headers: { "User-Agent": "RestaurantApp/1.0" } }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name
        }
      }
      throw new Error("Address not found")
    } catch (error) {
      console.error("Geocoding error:", error)
      return null
    }
  }

  // Auto detect location → reverse geocode → set preview
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported")
      setManualFormVisible(true)
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "User-Agent": "RestaurantApp/1.0" } }
          )
          const data = await response.json()

          setPreviewCoords({ lat: latitude, lon: longitude })
          setPreviewAddress(data.display_name || "Current location")
          setPendingUserDetails(null)

          setLoading(false)
        } catch (err) {
          console.error(err)
          setLoading(false)
          setManualFormVisible(true)
        }
      },
      () => {
        // user denied or error → manual fallback
        setLoading(false)
        setManualFormVisible(true)
      }
    )
  }
useEffect(() => {
  fetch(
    "http://ultipos.local:8000/api/method/ultipos.api.store.get_store?outlet_code=ultipos-main"
  )
    .then(r => r.json())
    .then(data => {
      setStore(data.message)   // 🔥 THIS WAS MISSING
      setLoadingStore(false)
    })
    .catch(err => {
      console.error(err)
      setLoadingStore(false)
    })
}, [])




  // Manual address submit → geocode → set preview
  const handleManualSubmit = async e => {
    e.preventDefault()
    setLoading(true)

    const fullAddressString = `${manualAddress.street}, ${manualAddress.city}, ${manualAddress.zip}`

    const coords = await getCoordinatesFromAddress(fullAddressString)

    if (coords) {
      setPreviewCoords({ lat: coords.lat, lon: coords.lon })
      setPreviewAddress(coords.displayName)
      setPendingUserDetails({
        name: manualAddress.name,
        street: manualAddress.street,
        city: manualAddress.city,
        zip: manualAddress.zip
      })
      setLoading(false)
    } else {
      alert("We couldn't verify this address. Please try again.")
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setLocationModalOpen(false)
    setManualFormVisible(false)
    setPreviewCoords(null)
    setPreviewAddress("")
    setPendingUserDetails(null)
  }

  const handleConfirmLocation = () => {
    if (!previewCoords || !previewAddress) return

    dispatch(
      setLocation({
        type: manualFormVisible ? "manual" : "auto",
        address: previewAddress,
        coords: { lat: previewCoords.lat, lon: previewCoords.lon },
        userDetails: pendingUserDetails
      })
    )

    setLocationModalOpen(false)
    setManualFormVisible(false)
    setPreviewCoords(null)
    setPreviewAddress("")
    setPendingUserDetails(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 relative overflow-x-hidden">
      {/* LOCATION MODAL */}
{/* LOCATION MODAL */}
<AnimatePresence>
  {isLocationModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        // 👇 added max-h + flex-col so content can scroll
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header (unchanged) */}
        <div className="bg-orange-600 p-6 text-white text-center relative shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <h2 className="text-2xl font-bold">Welcome!</h2>
          <p className="opacity-90 text-sm mt-1">
            We need your location to show nearby restaurants.
          </p>
        </div>

        {/* Body – now scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {!manualFormVisible ? (
            <div className="space-y-4">
              <Button
                onClick={handleAutoDetect}
                disabled={loading}
                className="w-full py-4 text-lg bg-gray-900 hover:bg-black text-white"
              >
                {loading ? (
                  "Locating..."
                ) : (
                  <>
                    <Navigation size={20} /> Use Current Location
                  </>
                )}
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">
                  OR
                </span>
                <div className="flex-grow border-t border-gray-200" />
              </div>

              <Button
                variant="outline"
                onClick={() => setManualFormVisible(true)}
                className="w-full py-4"
              >
                Enter Address Manually
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleManualSubmit}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Enter Details</h3>
                <button
                  type="button"
                  onClick={() => setManualFormVisible(false)}
                  className="text-gray-400 hover:text-black text-sm underline"
                >
                  Back
                </button>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">
                  Your Name
                </label>
                <Input
                  placeholder="John Doe"
                  required
                  value={manualAddress.name}
                  onChange={e =>
                    setManualAddress(prev => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                />
              </div>

              {/* Street */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">
                  Street Address
                </label>
                <Input
                  placeholder="123 Main St"
                  required
                  value={manualAddress.street}
                  onChange={e =>
                    setManualAddress(prev => ({
                      ...prev,
                      street: e.target.value
                    }))
                  }
                />
              </div>

              {/* City + ZIP */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    City
                  </label>
                  <Input
                    placeholder="Sydney"
                    required
                    value={manualAddress.city}
                    onChange={e =>
                      setManualAddress(prev => ({
                        ...prev,
                        city: e.target.value
                      }))
                    }
                  />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    ZIP
                  </label>
                  <Input
                    placeholder="2000"
                    required
                    value={manualAddress.zip}
                    onChange={e =>
                      setManualAddress(prev => ({
                        ...prev,
                        zip: e.target.value
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2"
              >
                {loading ? "Verifying..." : "Find on map"}
              </Button>
            </form>
          )}

          {/* Map preview + confirm */}
          {previewCoords && (
            <div className="mt-1 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">
                  Location preview
                </p>
                {previewAddress && (
                  <p className="text-[11px] text-gray-400 text-right line-clamp-2">
                    {previewAddress}
                  </p>
                )}
              </div>

              <LocationMapPreview coords={previewCoords} />

              <Button
                onClick={handleConfirmLocation}
                disabled={loading}
                className="w-full py-3"
              >
                Confirm location & continue
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              U
            </div>
            <span className="font-bold text-xl hidden sm:block tracking-tight">
              Ultipos
            </span>
          </div>

          {/* Delivery / Pickup toggle */}
          <div className="bg-gray-100 p-1 rounded-full flex items-center shadow-inner">
            <button
              onClick={() => setServiceType("delivery")}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                serviceType === "delivery"
                  ? "bg-white text-gray-900 shadow-sm scale-105"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setServiceType("pickup")}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                serviceType === "pickup"
                  ? "bg-white text-gray-900 shadow-sm scale-105"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pickup
            </button>
          </div>

          {/* Location chip – icon only on mobile, icon + text on md+ */}
          <button
            className="flex items-center gap-1 sm:gap-2 text-sm bg-orange-50 text-orange-700 px-2 sm:px-3 py-1 rounded-full cursor-pointer"
            onClick={() => setLocationModalOpen(true)}
          >
            <MapPin size={18} />
            <span className="hidden sm:inline truncate max-w-[150px] font-medium">
              {storedLocation || "Select Location"}
            </span>
          </button>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-orange-600 text-white py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]" />
        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-2">
              Craving something?
            </h1>
            <p className="text-orange-100 text-lg">
              Order from your favorite local restaurants.
            </p>
          </div>
          
        </div>
      </div>

      {/* RESTAURANT GRID – ONLY AFTER LOCATION IS SET */}
      {hasLocation ? (
        <main className="max-w-6xl mx-auto px-4 py-8">
         <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
  Available Restaurants
  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
    {store ? 1 : 0} nearby
  </span>
</h2>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
{store && (
  <RestaurantCard
    data={{
      name: store.restaurant.name,
      image: store.restaurant.logo || "/placeholder.svg",
      rating: 4.5,
      deliveryFee: "Free",
      categories: ["Fast Food"],
      isOpen: store.outlet.is_open
    }}
    onClick={() => navigate(`/s/${store.outlet.outlet_code}`)}
  />
)}


          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
          <p>Please allow location or enter your address to see restaurants.</p>
        </main>
      )}
    </div>
  )
}

// Map preview using OpenStreetMap embed
const LocationMapPreview = ({ coords }) => {
  if (!coords) return null

  const { lat, lon } = coords
  const delta = 0.01
  const minLon = lon - delta
  const minLat = lat - delta
  const maxLon = lon + delta
  const maxLat = lat + delta

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${lat},${lon}`
  const linkHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`

  return (
    <div className="space-y-2">
      <div className="w-full h-52 rounded-xl overflow-hidden border border-gray-200">
        <iframe
          title="Location preview"
          src={src}
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
      <a
        href={linkHref}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-orange-600 hover:underline"
      >
        Open in OpenStreetMap
      </a>
    </div>
  )
}

const RestaurantCard = ({ data, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
    onClick={onClick}
    className="group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
  >
    <div className="relative h-48 overflow-hidden">
      <img
        src={data.image}
        alt={data.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      {!data.isOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="bg-white text-black font-bold px-3 py-1 rounded text-sm">
            CLOSED
          </span>
        </div>
      )}
     
    </div>

    <div className="p-4">
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-lg text-gray-900">{data.name}</h3>
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold">
          <span className="text-xs">{data.rating}</span>
          <Star size={10} fill="currentColor" />
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-3 truncate">
        {data.categories.join(" • ")}
      </p>

      <div className="flex items-center gap-4 text-xs font-medium text-gray-500 border-t pt-3">
        <div className="flex items-center gap-1">
          <Bike size={14} /> {data.deliveryFee}
        </div>
        <div className="flex items-center gap-1">
          <ShoppingBag size={14} /> Min $10
        </div>
      </div>
    </div>
  </motion.div>
)

export default Home
