import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import BookingWidget from "../BookingWidget";
import PlaceGallery from "../PlaceGallery";
import AddressLink from "../AddressLink";

export default function PlacePage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/places/${id}`).then(response => setPlace(response.data));
  }, [id]);

  if (!place) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading place details...</span>
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

      <PlaceGallery place={place} />

      {/* Booking and Details Grid */}
      <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-[2fr_1fr] items-start">
        {/* Left Column: Details */}
        <div className="space-y-6">
          {/* Description Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {place.description}
            </p>
          </div>

          {/* Check-in/Out/Guests Card */}
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

          {/* Extra Info Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Extra Info</h2>
            <p className="text-gray-700 leading-relaxed">
              {place.extraInfo}
            </p>
          </div>
        </div>

        {/* Right Column: Booking Widget */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-md sticky top-24">
            <div className="text-xl font-semibold text-gray-800 mb-4">
              Price: Rs. {place.price} <span className="text-gray-600 font-normal">/ night</span>
            </div>
            <BookingWidget place={place} />
          </div>
        </div>
      </div>
    </div>
  );
}
