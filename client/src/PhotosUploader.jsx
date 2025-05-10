// PhotosUploader.jsx
import axios from "axios";
import { useState } from "react";
import Image from "./Image.jsx";

/**
 * @param {string[]} addedPhotos  - array of photo URLs
 * @param {(photos: string[]) => void} onChange - callback to update parent state
 */
export default function PhotosUploader({ addedPhotos, onChange }) {
  const [photoLink, setPhotoLink] = useState("");

  // Upload by external link
  async function addPhotoByLink(ev) {
    ev.preventDefault();
    if (!photoLink) return;
    try {
      const { data: url } = await axios.post("/api/upload-by-link", {
        link: photoLink,
      });
      onChange((prev) => [...prev, url]);
      setPhotoLink("");
    } catch (err) {
      console.error("Link upload failed", err);
      // TODO: show error to user (e.g. toast or inline message)
    }
  }

  // Upload from local device
  async function uploadPhoto(ev) {
    const files = ev.target.files;
    if (files.length === 0) return;
    const data = new FormData();
    for (let file of files) {
      data.append("photos", file);
    }
    try {
      const { data: urls } = await axios.post("/api/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error("File upload failed", err);
      // TODO: show error to user
    }
  }

  // Remove a photo from the list
  function removePhoto(ev, link) {
    ev.preventDefault();
    onChange(addedPhotos.filter((photo) => photo !== link));
  }

  // Mark a photo as the main (first) one
  function selectAsMainPhoto(ev, link) {
    ev.preventDefault();
    onChange([link, ...addedPhotos.filter((photo) => photo !== link)]);
  }

  return (
    <>
      {/* Add by link */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add using a link …"
          value={photoLink}
          onChange={(ev) => setPhotoLink(ev.target.value)}
          className="grow border rounded p-2"
        />
        <button
          onClick={addPhotoByLink}
          className="bg-gray-200 px-4 rounded-2xl"
        >
          Add photo
        </button>
      </div>

      {/* Photo grid & upload button */}
      <div className="mt-2 grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {addedPhotos.map((link) => (
          <div key={link} className="h-32 relative">
            <Image
              src={link}
              alt=""
              className="w-full h-full object-cover rounded-2xl"
            />
            <button
              onClick={(ev) => removePhoto(ev, link)}
              className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
            >
              🗑
            </button>
            <button
              onClick={(ev) => selectAsMainPhoto(ev, link)}
              className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
            >
              {link === addedPhotos[0] ? "★" : "☆"}
            </button>
          </div>
        ))}

        {/* Upload from device */}
        <label className="h-32 flex items-center justify-center border rounded-2xl text-2xl text-gray-600 cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={uploadPhoto}
          />
          ⬆️ Upload
        </label>
      </div>
    </>
  );
}
