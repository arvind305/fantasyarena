/**
 * AuthProvider.js — Google OAuth via Google Identity Services (GIS).
 *
 * Uses the GIS "Sign In With Google" button / One Tap flow.
 * No extra npm dependencies required — the GIS script is loaded in index.html.
 *
 * Auth state shape:
 *   { userId, name, email, avatar, token }
 *
 * The raw Google token (id_token or access_token) is stored alongside
 * the decoded user info and sent with every write API call.
 *
 * Persisted to localStorage so auth survives refreshes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { trackEvent } from "../analytics";

const AuthContext = createContext(null);

const STORAGE_KEY = "fantasy_arena_auth_v3";
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const DEV_MODE = process.env.NODE_ENV === "development" && !CLIENT_ID;

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

/**
 * Save user profile via server-side API (authenticated).
 */
async function saveProfileViaApi(token, avatar) {
  try {
    await fetch('/api/save-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ avatar }),
    });
  } catch {
    // Non-critical, don't block auth flow
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const persisted = loadPersistedUser();
    // Migrate from v2 storage (without token) — force re-login
    if (persisted && !persisted.token) {
      localStorage.removeItem("fantasy_arena_auth_v2");
      return null;
    }
    return persisted;
  });
  const tokenRef = useRef(user?.token || null);

  // On initial load, verify stored token with server (once per session)
  const verifiedRef = useRef(false);
  useEffect(() => {
    if (verifiedRef.current) return;
    const persisted = loadPersistedUser();
    if (!persisted?.token) return;

    verifiedRef.current = true;

    // Verify the token is still valid
    fetch('/api/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${persisted.token}`,
      },
    })
      .then(r => {
        if (!r.ok) {
          // Token expired or invalid — clear auth state
          console.warn('[Auth] Stored token is invalid, clearing auth state');
          verifiedRef.current = false;
          setUser(null);
          persistUser(null);
          tokenRef.current = null;
        } else {
          // Token valid — save profile (only on first load)
          saveProfileViaApi(persisted.token, persisted.avatar);
        }
      })
      .catch(() => {
        // Network error — don't force logout, keep local state
        verifiedRef.current = false;
      });
  }, []);

  // Handle the credential response from Google (GIS auto-select / One Tap)
  const handleCredentialResponse = useCallback((response) => {
    const payload = decodeJwtPayload(response.credential);
    if (!payload) return;

    const authUser = {
      userId: payload.sub,
      name: payload.name || "",
      email: payload.email || "",
      avatar: payload.picture || "",
      token: response.credential, // Store the raw JWT id_token
    };

    setUser(authUser);
    persistUser(authUser);
    tokenRef.current = response.credential;
    trackEvent("sign_in", { userId: authUser.userId });
    saveProfileViaApi(response.credential, authUser.avatar);
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

    if (window.google?.accounts?.id) {
      init();
    } else {
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
    // Dev mode: skip OAuth and use a fake admin user
    if (DEV_MODE) {
      const devEmail = window.__FA_ADMIN_EMAIL__ || process.env.REACT_APP_ADMIN_EMAIL || "admin@dev.local";
      const devUser = {
        userId: "dev_user_001",
        name: "Dev Admin",
        email: devEmail,
        avatar: "",
        token: "dev_token", // Placeholder token for dev mode
      };
      console.log("[Auth] DEV MODE: Logging in as", devEmail);
      setUser(devUser);
      persistUser(devUser);
      tokenRef.current = "dev_token";
      trackEvent("sign_in", { userId: devUser.userId, dev: true });
      return;
    }

    if (!CLIENT_ID) {
      console.warn("Google Client ID not configured. Set REACT_APP_GOOGLE_CLIENT_ID in .env");
      return;
    }

    // Use the OAuth2 token client — opens a real popup
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid profile email",
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            const accessToken = tokenResponse.access_token;

            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
              .then((r) => r.json())
              .then((info) => {
                const authUser = {
                  userId: info.sub,
                  name: info.name || "",
                  email: info.email || "",
                  avatar: info.picture || "",
                  token: accessToken, // Store the access_token
                };
                setUser(authUser);
                persistUser(authUser);
                tokenRef.current = accessToken;
                trackEvent("sign_in", { userId: authUser.userId });
                saveProfileViaApi(accessToken, authUser.avatar);
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
    tokenRef.current = null;
    trackEvent("sign_out");
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  /**
   * Get the current auth token for API calls.
   * Returns the raw Google token (id_token or access_token).
   */
  const getToken = useCallback(() => {
    return tokenRef.current || user?.token || null;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state.
 * Returns { user, signIn, signOut, getToken }.
 * user is null when not signed in.
 * getToken() returns the raw Google OAuth token for API calls.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
