"use client";
import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, LocateFixed } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setLocation } from "../redux/locationSlice";
import { Button } from "@/components/ui/button";

export function DeliverySelector() {
  const dispatch = useDispatch();
  const location = useSelector((state) => state.location);

  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const menuRef = useRef();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const modes = [
    { value: "delivery", label: "Delivery" },
    { value: "pickup", label: "Pickup" },
  ];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name;

          dispatch(
            setLocation({
              type: location.type,
              data: address,
            })
          );
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Could not retrieve address.");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location.");
        setLoadingLocation(false);
      }
    );
  };

  return (
    <div>
     
    </div>
  );
}
