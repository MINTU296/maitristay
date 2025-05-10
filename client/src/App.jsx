import './App.css';
import { Route, Routes, Navigate } from "react-router-dom"; // ✅ Correct imports
import { useContext } from "react"; // ✅ Added React import for useContext
import IndexPage from "./pages/IndexPage.jsx";
import LoginPage from "./pages/LoginPage";
import Layout from "./Layout";
import RegisterPage from "./pages/RegisterPage";
import axios from "axios";
import { UserContextProvider, UserContext } from "./UserContext";
import ProfilePage from "./pages/ProfilePage.jsx";
import PlacesPage from "./pages/PlacesPage";
import PlacesFormPage from "./pages/PlacesFormPage";
import PlacePage from "./pages/PlacePage";
import BookingsPage from "./pages/BookingsPage";
import BookingPage from "./pages/BookingPage";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

function ProtectedRoute({ children }) {
  const { user } = useContext(UserContext); // ✅ Now uses React's useContext
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<IndexPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/place/:id" element={<PlacePage />} />

          {/* Protected Routes */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/places"
            element={
              <ProtectedRoute>
                <PlacesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/places/new"
            element={
              <ProtectedRoute>
                <PlacesFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/places/:id"
            element={
              <ProtectedRoute>
                <PlacesFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </UserContextProvider>
  );
}

export default App;