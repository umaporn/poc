// app/location/page.tsx
"use client";

import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export default function LocationPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Get Location (PWA + Google Maps)</h1>

      <button
        onClick={getLocation}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        Get My Location
      </button>

      {location && (
        <div className="mt-6 w-full max-w-2xl h-[400px]">
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={location}
              zoom={15}
            >
              <Marker position={location} />
            </GoogleMap>
          </LoadScript>
					<div className="mt-2 text-center">
						<p className="text-gray-700">Latitude: {location.lat}</p>
						<p className="text-gray-700">Longitude: {location.lng}</p>
					</div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-600 font-medium">Error: {error}</p>
      )}
    </div>
  );
}
