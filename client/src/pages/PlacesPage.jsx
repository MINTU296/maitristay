import { Link } from "react-router-dom";
import AccountNav from "../AccountNav";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "../Image"; // or PlaceImg, whichever you use

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    // Example route that returns user's places with "photos: [ '/uploads/abc.jpg', ... ]"
    axios.get('/api/user-places').then(({ data }) => {
      setPlaces(data);
    });
  }, []);

  return (
    <div>
      <AccountNav />

      <div className="text-center">
        <Link
          className="inline-flex gap-1 bg-primary text-white py-2 px-6 rounded-full"
          to="/account/places/new"
        >
          {/* SVG icon */}
          Add new place
        </Link>
      </div>

      <div className="mt-4">
        {places.length > 0 && places.map(place => (
          <Link
            key={place._id}
            to={`/account/places/${place._id}`}
            className="flex cursor-pointer gap-4 bg-gray-100 p-4 rounded-2xl mb-4"
          >
            <div className="flex w-32 h-32 bg-gray-300 grow shrink-0">
              {/* If place.photos[0] = "/uploads/<filename>", 
                  <Image> will do "http://localhost:5000/uploads/<filename>"
               */}
              <Image className="object-cover w-full h-full" src={place.photos?.[0]} alt={place.title} />
            </div>
            <div>
              <h2 className="text-xl">{place.title}</h2>
              <p className="text-sm mt-2">{place.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
