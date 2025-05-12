// PhotosUploader.jsx
import React from "react";
import Image from "./Image.jsx";

// Make sure you define this in your env:
// REACT_APP_API_URL=https://maitristayvmm.vercel.app   (or http://localhost:5000)
const API_URL = process.env.REACT_APP_API_URL;

export default function PlaceImg({
  place,
  index = 0,
  className = "object-cover",
}) {
  // 1) nothing to show
  if (!place?.photos?.length) return null;

  // 2) pick the photo at `index`
  const photo = place.photos[index];
  if (typeof photo !== "string") return null;

  // 3) is it already an absolute URL?
  const isAbsolute = /^https?:\/\//i.test(photo) || photo.startsWith("//");

  // 4) build the final src
  let src = photo;
  if (!isAbsolute) {
    if (!API_URL) {
      console.warn(
        "REACT_APP_API_URL is not set; defaulting to photo as-is"
      );
    } else {
      // ensure we don't end up with double slashes
      const slash = photo.startsWith("/") ? "" : "/";
      src = `${API_URL}${slash}${photo}`;
    }
  }

  return (
    <Image
      className={className}
      src={src}
      alt={place.title || "Place"}
    />
  );
}
