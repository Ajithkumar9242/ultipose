// App.jsx
import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import Menuu from "./pages/Menuu"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import NotFound from "./pages/NotFound"


// ⬇️ NEW imports
import PaymentReturn from "./pages/PaymentReturn"
import OrderStatusPage from "./pages/OrderStatus"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menuu />} />
        <Route path="/s/:storeCode" element={<Menuu />} />


        {/* ⬇️ NEW ROUTES */}
        <Route path="/payment-return" element={<PaymentReturn />} />
        <Route path="/order-status/:orderId" element={<OrderStatusPage />} />

        {/* Redirect /store/:storeCode → /s/:storeCode */}
        <Route
          path="/store/:storeCode"
          element={
            <Navigate
              to={location => {
                const storeCode = location.pathname.split("/").pop()
                return `/s/${storeCode}`
              }}
              replace
            />
          }
        />

        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
