import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLocation } from '../redux/locationSlice';
import { FaSearch, FaMapMarkerAlt, FaShoppingBag, FaTruck } from 'react-icons/fa';

const Home = () => {
  const [activeTab, setActiveTab] = useState('delivery');
  const [manualLocation, setManualLocation] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLocationDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name;

          dispatch(setLocation({ type: activeTab, data: address }));
          // ⬇️ GO TO DYNAMIC STORE ROUTE INSTEAD OF /menu
          navigate("/s/ultipos-test-store-1");
        } catch (err) {
          console.error("Error reverse geocoding:", err);
          alert("Could not fetch address.");
        }
      },
      () => {
        alert("Unable to retrieve your location");
      }
    );
  };

  const handleManualLocation = () => {
    if (manualLocation.trim() === '') return;
    dispatch(setLocation({ type: 'manual', data: manualLocation }));
    // ⬇️ ALSO GO TO DYNAMIC STORE ROUTE HERE
    navigate("/s/ultipos-test-store-1");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <img
            src="https://static.vecteezy.com/system/resources/previews/017/764/201/non_2x/bird-freedom-fly-animal-line-art-linear-simple-abstract-minimalist-circle-border-logo-design-vector.jpg"
            alt="Logo"
            className="w-10 h-10"
          />
          <h2 className="text-lg font-semibold">React Restaurant</h2>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'delivery'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('delivery')}
        >
          Delivery
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'pickup'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('pickup')}
        >
          Pickup
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <p className="text-gray-500 mb-2">Let's get ordering</p>
        <h1 className="text-2xl font-bold mb-6">
          Set your delivery location to get started.
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-lg">
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded w-full md:w-auto"
            onClick={handleLocationDetect}
          >
            <FaMapMarkerAlt />
            Use my current location
          </button>

          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search street, locality..."
              className="pl-10 pr-3 py-3 border rounded w-full"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
            />
          </div>
        </div>
      </main>

      {/* Steps */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-t text-center text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-1 p-4">
          <FaMapMarkerAlt className="text-xl" />
          <p className="font-medium">Set your location</p>
          <p>Tell us where you want to get your items delivered</p>
        </div>
        <div className="flex flex-col items-center gap-1 p-4 border-t md:border-t-0 md:border-l md:border-r">
          <FaShoppingBag className="text-xl" />
          <p className="font-medium">Choose your items</p>
          <p>Add the items you want in your cart</p>
        </div>
        <div className="flex flex-col items-center gap-1 p-4">
          <FaTruck className="text-xl" />
          <p className="font-medium">Have it delivered instantly</p>
          <p>Our delivery partners will deliver your order at your doorstep</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
