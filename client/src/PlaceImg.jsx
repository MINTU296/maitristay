import Image from "./Image.jsx";

export default function PlaceImg({ place, index = 0, className = null }) {
  if (!place?.photos?.length) {
    return null;
  }

  if (!className) {
    className = 'object-cover';
  }

  const photo = place.photos[index];
  let imagePath = photo;

  // If the stored path is just "/uploads/filename.jpg" (no "http"), prepend "http://localhost:5000"
  if (!photo.startsWith('http')) {
    imagePath = `http://localhost:5000${photo}`;
  }

  return (
    <Image
      className={className}
      src={imagePath}
      alt={place.title || 'Place'}
    />
  );
}
