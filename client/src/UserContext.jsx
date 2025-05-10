import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if the token cookie exists
    const hasToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith("token="));
    if (!hasToken) {
      // No token means user is not authenticated—set ready to true and skip fetching profile.
      setReady(true);
      return;
    }
    // If token exists, attempt to fetch the user profile
    axios.get('/api/profile', { withCredentials: true })
      .then(({ data }) => {
        setUser(data);
        setReady(true);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setReady(true); // Allow the app to render even if the fetch fails
      });
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}
