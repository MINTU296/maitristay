import { useContext, useState } from "react";
import { UserContext } from "../UserContext.jsx";
import { Link, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import PlacesPage from "./PlacesPage";
import AccountNav from "../AccountNav";

export default function ProfilePage() {
  const [redirect, setRedirect] = useState(null);
  const { ready, user, setUser } = useContext(UserContext);
  let { subpage } = useParams();
  if (!subpage) subpage = "profile";

  async function logout() {
    await axios.post('/api/logout');
    setUser(null);
    setRedirect('/');
  }

  if (!ready) return (
    <div className="flex items-center justify-center h-screen">
      <span className="text-gray-500">Loading...</span>
    </div>
  );

  if (ready && !user && !redirect) {
    return <Navigate to="/login" />;
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountNav />
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        {/* Subpage Navigation Tabs */}
        <div className="flex justify-center mb-8 space-x-4">
          <Link
            to="/account/profile"
            className={`px-4 py-2 rounded-lg transition ${subpage === 'profile' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Profile
          </Link>
          <Link
            to="/account/places"
            className={`px-4 py-2 rounded-lg transition ${subpage === 'places' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            My Places
          </Link>
        </div>

        {/* Content */}
        {subpage === 'profile' && (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome, {user.name}!</h2>
            <p className="text-gray-600 mb-6">{user.email}</p>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        )}

        {subpage === 'places' && (
          <PlacesPage />
        )}
      </div>
    </div>
  );
}
