// App.jsx
import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import Menuu from "./pages/Menuu"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import NotFound from "./pages/NotFound"

// NEW imports
import PaymentReturn from "./pages/PaymentReturn"
import OrderStatusPage from "./pages/OrderStatus"
import FakeWorldline from "./pages/FakeWorldline"
import Payment from "./pages/Payment"
import WorldlinePay from "./pages/Worldlinepay"
import OrderHistoryPage from "./pages/OrderHistory"

function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* ✅ IMPORTANT: REMOVE /menu or redirect */}
      <Route path="/menu" element={<Navigate to="/" replace />} />

      {/* ✅ Real menu route */}
      <Route path="/s/:storeCode" element={<Menuu />} />

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

      {/* Routes */}
      <Route path="/payment-return" element={<PaymentReturn />} />
      <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
      <Route path="/track/:orderId" element={<OrderStatusPage />} />

      <Route path="/payment" element={<Payment />} />
      <Route path="/worldline-pay" element={<FakeWorldline />} />

      <Route path="/checkout" element={<Checkout />} />
      <Route path="/cart" element={<Cart />} />
<Route path="/worldline-pay" element={<WorldlinePay />} />
<Route path="/order-history" element={<OrderHistoryPage />} />

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
