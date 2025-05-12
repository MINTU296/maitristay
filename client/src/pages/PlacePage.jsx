// src/pages/PlacePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import BookingWidget from "../BookingWidget";
import AddressLink from "../AddressLink";
import PlaceGallery from "../PlaceGallery";

// 1) Configure your Vercel API host and send cookies
const API_URL = process.env.REACT_APP_API_URL || "";
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

export default function PlacePage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/places/${id}`)            // → actually calls `${API_URL}/api/places/${id}`
      .then(({ data }) => setPlace(data))
      .catch((err) => {
        console.error("Failed to load place:", err);
        setError("Unable to load this place. Please try again later.");
      });
  }, [id]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading place details…</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-8 px-4">
      <h1 className="text-4xl font-semibold text-gray-800 mb-2">
        {place.title}
      </h1>
      <AddressLink className="text-blue-600 hover:underline mb-6 block">
        {place.address}
      </AddressLink>

      {/* This will render your photos using PlaceImg internally */}
      <PlaceGallery place={place} />

      <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-[2fr_1fr] items-start">
        {/* LEFT: Description, timings, extra info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {place.description}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-gray-800">Check-in</h3>
              <p className="text-gray-700">{place.checkIn}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Check-out</h3>
              <p className="text-gray-700">{place.checkOut}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Max Guests</h3>
              <p className="text-gray-700">{place.maxGuests}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Extra Info</h2>
            <p className="text-gray-700 leading-relaxed">
              {place.extraInfo}
            </p>
          </div>
        </div>

        {/* RIGHT: Booking widget */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-md sticky top-24">
            <div className="text-xl font-semibold text-gray-800 mb-4">
              Price: Rs. {place.price}{" "}
              <span className="text-gray-600 font-normal">/ night</span>
            </div>
            <BookingWidget place={place} />
          </div>
        </div>
      </div>
    </div>
  );
}
