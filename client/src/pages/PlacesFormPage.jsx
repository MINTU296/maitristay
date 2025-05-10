import PhotosUploader from "../PhotosUploader.jsx";
import Perks from "../Perks.jsx";
import { useEffect, useState } from "react";
import axios from "axios";
import AccountNav from "../AccountNav";
import { Navigate, useParams } from "react-router-dom";

export default function PlacesFormPage() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [maxGuests, setMaxGuests] = useState(1);
  const [price, setPrice] = useState(100);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get('/api/places/'+id).then(({ data }) => {
      setTitle(data.title);
      setAddress(data.address);
      setAddedPhotos(data.photos);
      setDescription(data.description);
      setPerks(data.perks);
      setExtraInfo(data.extraInfo);
      setCheckIn(data.checkIn);
      setCheckOut(data.checkOut);
      setMaxGuests(data.maxGuests);
      setPrice(data.price);
    });
  }, [id]);

  async function savePlace(ev) {
    ev.preventDefault();
    const placeData = { title, address, addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price };
    if (id) {
      await axios.put('/api/places', { id, ...placeData });
    } else {
      await axios.post('/api/places', placeData);
    }
    setRedirect(true);
  }

  if (redirect) return <Navigate to='/account/places' />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <AccountNav />
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-lg mt-6">
        <h1 className="text-3xl font-semibold text-gray-800 text-center mb-6">
          {id ? 'Edit Place' : 'Add New Place'}
        </h1>
        <form onSubmit={savePlace} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short, catchy title"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-sm text-gray-500 mt-1">Title for your place. Keep it short and descriptive.</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street address, city, country"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-sm text-gray-500 mt-1">Where is your place located?</p>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Photos</label>
            <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />
            <p className="text-sm text-gray-500 mt-1">Add photos to showcase your place. More is better!</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your place"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">What makes your place unique?</p>
          </div>

          {/* Perks */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Perks</label>
            <Perks selected={perks} onChange={setPerks} />
            <p className="text-sm text-gray-500 mt-1">Select all amenities available at your place.</p>
          </div>

          {/* Extra Info */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Extra Info</label>
            <textarea
              value={extraInfo}
              onChange={e => setExtraInfo(e.target.value)}
              rows={3}
              placeholder="House rules, etc."
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">Additional details guests should know.</p>
          </div>

          {/* Check-in/Out & Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Check-in Time</label>
              <input
                type="text"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                placeholder="14:00"
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Check-out Time</label>
              <input
                type="text"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                placeholder="11:00"
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Max Guests</label>
              <input
                type="number"
                value={maxGuests}
                onChange={e => setMaxGuests(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Price per Night</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Save Place
          </button>
        </form>
      </div>
    </div>
  );
}
