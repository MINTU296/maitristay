import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import AddressLink from "../AddressLink";
import PlaceGallery from "../PlaceGallery";
import BookingDates from "../BookingDates";

export default function BookingPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (id) {
      axios.get('/api/bookings', { withCredentials: true })
        .then(response => {
          const found = response.data.find(b => b._id === id);
          if (found) setBooking(found);
        })
        .catch(err => {
          console.error('Error loading booking:', err);
          // handle 401
          if (err.response?.status === 401) {
            window.location.href = '/login';
          }
        });
    }
  }, [id]);

  if (!booking) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading booking details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <h1 className="text-4xl font-semibold text-gray-800 mb-2">
        {booking.place.title}
      </h1>
      <AddressLink className="text-blue-600 hover:underline">
        {booking.place.address}
      </AddressLink>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            Your Booking Details
          </h2>
          <BookingDates booking={booking} />
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-md flex flex-col items-center justify-center">
          <div className="text-lg">Total Price</div>
          <div className="text-4xl font-bold mt-2">Rs. {booking.price}</div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Photos of the Place
        </h3>
        <PlaceGallery place={booking.place} />
      </div>
    </div>
  );
}
