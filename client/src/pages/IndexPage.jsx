import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Image from "../Image.jsx";
import { Star, Heart, Search } from "lucide-react";

export default function IndexPage() {
  const [places, setPlaces] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');

  useEffect(() => {
    axios.get('/api/places').then(response => setPlaces(response.data));
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // Filter and sort
  const filtered = places.filter(place => {
    const q = searchQuery.toLowerCase();
    return (
      place.title.toLowerCase().includes(q) ||
      (place.address && place.address.toLowerCase().includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === 'price-asc') return a.price - b.price;
    if (sortOption === 'price-desc') return b.price - a.price;
    if (sortOption === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Hero Section */}
      <div className="mb-12 px-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center">Find Your Perfect Stay</h1>
          <p className="mt-2 text-center text-lg opacity-90">Search hotels, apartments, and more</p>
          <form onSubmit={handleSearch} className="mt-6 flex justify-center">
            <div className="flex items-center w-full max-w-md bg-white rounded-full overflow-hidden">
              {/* Search Icon */}
              <button type="submit" className="p-2 cursor-pointer" aria-label="Search">
                <Search className="h-6 w-6 text-gray-400" />
              </button>
              {/* Text Input */}
              <input
                type="text"
                placeholder="Search by title or location"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="
                  flex-grow
                  p-2
                  text-gray-900             /* ensure dark text */
                  placeholder-gray-500      /* hint color */
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-300
                  transition
                  cursor-text
                "
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sort Control */}
      <div className="max-w-6xl mx-auto px-4 mb-6 flex justify-end">
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Sort by</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      {/* Places Grid */}
      <div className="max-w-6xl mx-auto px-4 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map(place => (
          <Link
            key={place._id}
            to={`/place/${place._id}`}
            className="group relative block overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-transform hover:scale-105 bg-white"
          >
            {/* Favorite Icon */}
            <div className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-1 z-10">
              <Heart className="h-5 w-5 text-red-500 hover:text-red-600 cursor-pointer" />
            </div>

            {/* Image */}
            <div className="relative h-48">
              {place.photos?.[0] && (
                <Image
                  src={place.photos[0]}
                  alt={place.title}
                  className="object-cover w-full h-full"
                />
              )}
            </div>

            {/* Info Overlay on Hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 transition" />
            <div className="absolute bottom-0 left-0 w-full p-4 opacity-0 group-hover:opacity-100 transition">
              <h3 className="text-white text-lg font-semibold truncate">{place.title}</h3>
              <div className="mt-1 flex items-center text-yellow-400">
                <Star className="h-5 w-5" />
                <span className="ml-1 font-semibold">{place.rating ? place.rating.toFixed(1) : 'New'}</span>
              </div>
              <div className="mt-2 text-white font-bold">
                Rs. {place.price}<span className="text-gray-200 font-normal">/ night</span>
              </div>
            </div>

            {/* Details Below */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate">{place.title}</h3>
              <p className="text-gray-500 text-sm truncate">{place.address}</p>
              <div className="mt-2 flex items-center text-yellow-400">
                <Star className="h-4 w-4" />
                <span className="ml-1 text-sm font-semibold">{place.rating ? place.rating.toFixed(1) : 'New'}</span>
              </div>
              <div className="mt-1 text-blue-600 font-bold">
                Rs. {place.price}<span className="text-gray-600 font-normal">/ night</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
