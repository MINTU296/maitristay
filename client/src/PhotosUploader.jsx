import axios from "axios";
import { useState } from "react";
import Image from "./Image.jsx";

/**
 * @param {string[]} addedPhotos
 * @param {(photos: string[]) => void} onChange
 */
export default function PhotosUploader({ addedPhotos, onChange }) {
  const [photoLink, setPhotoLink] = useState("");

  // 1) Add by external link
  async function addPhotoByLink(ev) {
    ev.preventDefault();
    if (!photoLink) return;
    try {
      const { data } = await axios.post("/api/upload-by-link", {
        link: photoLink,
      });
      // data.urls is an array of strings
      onChange((prev) => [...prev, ...data.urls]);
      setPhotoLink("");
    } catch (err) {
      console.error("Link upload failed", err);
    }
  }

  // 2) Upload from local device
  async function uploadPhoto(ev) {
    const files = ev.target.files;
    if (files.length === 0) return;
    const formData = new FormData();
    for (let file of files) formData.append("photos", file);
    try {
      const { data } = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange((prev) => [...prev, ...data.urls]);
    } catch (err) {
      console.error("File upload failed", err);
    }
  }

  // 3) Remove a photo
  function removePhoto(ev, link) {
    ev.preventDefault();
    onChange(addedPhotos.filter((photo) => photo !== link));
  }

  // 4) Mark a photo as main
  function selectAsMainPhoto(ev, link) {
    ev.preventDefault();
    onChange([link, ...addedPhotos.filter((photo) => photo !== link)]);
  }

  return (
    <>
      {/* Link uploader */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add using a link …"
          value={photoLink}
          onChange={(e) => setPhotoLink(e.target.value)}
          className="grow border rounded p-2"
        />
        <button onClick={addPhotoByLink} className="bg-gray-200 px-4 rounded-2xl">
          Add photo
        </button>
      </div>

      {/* Photo grid */}
      <div className="mt-2 grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {addedPhotos.map((link) => (
          <div key={link} className="h-32 relative">
            <Image
              src={link}
              alt=""
              className="w-full h-full object-cover rounded-2xl"
            />
            <button
              onClick={(e) => removePhoto(e, link)}
              className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
            >
              🗑
            </button>
            <button
              onClick={(e) => selectAsMainPhoto(e, link)}
              className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
            >
              {link === addedPhotos[0] ? "★" : "☆"}
            </button>
          </div>
        ))}

        {/* Device uploader */}
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
