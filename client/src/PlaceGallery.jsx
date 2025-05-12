// src/components/PlaceGallery.jsx
import { useState } from "react";
import PlaceImg from "./PlaceImg.jsx";

export default function PlaceGallery({ place }) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  if (showAllPhotos) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl">Photos of {place.title}</h2>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="flex gap-1 py-2 px-4 rounded-2xl bg-white text-black"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {place.photos.map((_, index) => (
              <div key={index} className="w-full">
                <PlaceImg
                  place={place}
                  index={index}
                  className="object-contain w-full max-h-[60vh]"
                  alt={`${place.title} photo ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-[2fr_1fr] gap-2 rounded-3xl overflow-hidden">
        {/* Main photo */}
        {place.photos[0] && (
          <div
            className="cursor-pointer"
            onClick={() => setShowAllPhotos(true)}
          >
            <PlaceImg
              place={place}
              index={0}
              className="aspect-square object-cover"
              alt={`${place.title} main photo`}
            />
          </div>
        )}

        {/* Secondary photos */}
        <div className="grid gap-2">
          {place.photos[1] && (
            <div
              className="cursor-pointer"
              onClick={() => setShowAllPhotos(true)}
            >
              <PlaceImg
                place={place}
                index={1}
                className="aspect-square object-cover"
                alt={`${place.title} photo 2`}
              />
            </div>
          )}

          {place.photos[2] && (
            <div
              className="cursor-pointer overflow-hidden relative top-2"
              onClick={() => setShowAllPhotos(true)}
            >
              <PlaceImg
                place={place}
                index={2}
                className="aspect-square object-cover"
                alt={`${place.title} photo 3`}
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowAllPhotos(true)}
        className="absolute bottom-2 right-2 flex gap-1 py-2 px-4 bg-white rounded-2xl shadow"
      >
        Show more photos
      </button>
    </div>
  );
}
