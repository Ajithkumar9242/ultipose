// App.jsx
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Menuu from "./pages/Menuu"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menuu />} />
        <Route path="/store/:storeCode" element={<Menuu />} />

        {/* ✅ new checkout route */}
        <Route path="/checkout" element={<Checkout />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
