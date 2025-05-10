import AccountNav from "../AccountNav";
import { useEffect, useState } from "react";
import axios from "axios";
import PlaceImg from "../PlaceImg";
import BookingDates from "../BookingDates";
import { Link } from "react-router-dom";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios.get('/api/bookings', { withCredentials: true })
      .then(response => setBookings(response.data))
      .catch(error => console.error('Failed to fetch bookings:', error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountNav />
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {bookings.length > 0 ? (
          bookings.map(booking => (
            <Link
              key={booking._id}
              to={`/account/bookings/${booking._id}`}
              className="flex flex-col md:flex-row bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden"
            >
              <div className="md:w-48 w-full h-48 md:h-auto flex-shrink-0 relative">
                <PlaceImg place={booking.place} className="object-cover w-full h-full" />
              </div>
              <div className="flex flex-col justify-between p-6 grow">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {booking.place.title}
                  </h2>
                  <div className="text-gray-600 mb-4">
                    <BookingDates booking={booking} />
                  </div>
                </div>
                <div className="flex items-center text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  <span className="text-xl font-semibold">
                    Rs. {booking.price}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-gray-500 py-20">
            You have no bookings yet.
          </div>
        )}
      </div>
    </div>
  );
}
