// src/data/restaurant.js

const restaurantData = [
  {
    id: 1,
    name: "Ultipos Test Store 1",
    storeCode: "ultipos-test-store-1",   // 👈 add this
    image:
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    rating: 4.5,
    time: "30-40 min",
    deliveryFee: "$2.99",
    categories: ["Pizza", "Wings"],
    isOpen: true
  },
  {
    id: 2,
    name: "Ultipos Test Store 2",
    storeCode: "ultipos-test-store-2",   // 👈 add this
    image:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
    rating: 4.2,
    time: "25-35 min",
    deliveryFee: "$1.49",
    categories: ["Burgers", "American"],
    isOpen: true
  },
  {
    id: 3,
    name: "Sushi Master",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    time: "45-55 min",
    deliveryFee: "$3.99",
    categories: ["Japanese", "Sushi"],
    isOpen: false
  },
  {
    id: 4,
    name: "Taco Bell",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    rating: 4.0,
    time: "20-30 min",
    deliveryFee: "Free",
    categories: ["Mexican", "Tacos"],
    isOpen: true
  },
  // 🔻 New ones
  {
    id: 5,
    name: "Subway",
    image:
      "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
    rating: 4.1,
    time: "20-25 min",
    deliveryFee: "$1.99",
    categories: ["Sandwiches", "Healthy"],
    isOpen: true
  },
  {
    id: 6,
    name: "KFC",
    image:
      "https://images.unsplash.com/photo-1694853651800-3e9b4aa96a42?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8a2ZjJTIwZnJpZWQlMjBjaGlja2VufGVufDB8fDB8fHww",
    rating: 4.3,
    time: "25-35 min",
    deliveryFee: "$2.49",
    categories: ["Fried Chicken", "Fast Food"],
    isOpen: false
  },
  {
    id: 7,
    name: "Pasta Palace",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    time: "35-45 min",
    deliveryFee: "$3.49",
    categories: ["Italian", "Pasta"],
    isOpen: true
  },
  {
    id: 8,
    name: "Veggie Delight",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    time: "30-40 min",
    deliveryFee: "Free",
    categories: ["Vegetarian", "Healthy"],
    isOpen: true
  }
];

export default restaurantData;
