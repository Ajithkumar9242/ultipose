import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty 🛒</h2>
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => navigate("/menu")}
        >
          Go back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.cartKey}
            className="flex items-center border p-2 rounded justify-between"
          >
            <div className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-gray-500">₹{item.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
              onClick={() => {
  dispatch(decreaseQuantity(item.cartKey));
  toast.success('Decreased quantity');
}}

                className="px-2 py-1 border rounded"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => {
  dispatch(increaseQuantity(item.cartKey));
  toast.success('Increased quantity');
}}
                className="px-2 py-1 border rounded"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center border-t pt-4">
        <span className="text-lg font-semibold">Total: ₹{total}</span>
        <button
  onClick={() => navigate("/checkout")}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Proceed to Checkout
</button>

      </div>
      <button
        onClick={() => {
  dispatch(clearCart());
  toast.error('Cart cleared');
}}
        className="mt-2 text-red-500 underline"
      >
        Clear Cart
      </button>
    </div>
  );
};

export default Cart;
