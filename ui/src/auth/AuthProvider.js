/**
 * AuthProvider.js — Google OAuth via Google Identity Services (GIS).
 *
 * Uses the GIS "Sign In With Google" button / One Tap flow.
 * No extra npm dependencies required — the GIS script is loaded in index.html.
 *
 * Auth state shape:
 *   { userId, name, email, avatar }
 *
 * Persisted to localStorage so auth survives refreshes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trackEvent } from "../analytics";

const AuthContext = createContext(null);

const STORAGE_KEY = "fantasy_arena_auth";
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

/**
 * Decode a JWT payload without a library (GIS returns a credential JWT).
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadPersistedUser);

  // Handle the credential response from Google
  const handleCredentialResponse = useCallback((response) => {
    const payload = decodeJwtPayload(response.credential);
    if (!payload) return;

    const authUser = {
      userId: payload.sub,
      name: payload.name || "",
      email: payload.email || "",
      avatar: payload.picture || "",
    };

    setUser(authUser);
    persistUser(authUser);
    trackEvent("sign_in", { userId: authUser.userId });
  }, []);

  // Initialize GIS once the script is loaded
  useEffect(() => {
    if (!CLIENT_ID) return;

    function init() {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });
    }

    // The GIS script may already be loaded or still loading
    if (window.google?.accounts?.id) {
      init();
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [handleCredentialResponse]);

  const signIn = useCallback(() => {
    if (!CLIENT_ID) {
      console.warn("Google Client ID not configured. Set REACT_APP_GOOGLE_CLIENT_ID in .env");
      return;
    }
    // Use the OAuth2 token client — opens a real popup that always works,
    // unlike google.accounts.id.prompt() which has a cooldown after dismissal.
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid profile email",
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
              .then((r) => r.json())
              .then((info) => {
                const authUser = {
                  userId: info.sub,
                  name: info.name || "",
                  email: info.email || "",
                  avatar: info.picture || "",
                };
                setUser(authUser);
                persistUser(authUser);
                trackEvent("sign_in", { userId: authUser.userId });
              });
          }
        },
      });
      client.requestAccessToken();
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    persistUser(null);
    trackEvent("sign_out");
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state.
 * Returns { user, signIn, signOut }.
 * user is null when not signed in.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
