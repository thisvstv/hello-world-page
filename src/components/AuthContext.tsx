/**
 * src/context/AuthContext.tsx
 *
 * ── Bug fixed vs. the previous version ───────────────────────
 *
 * BUG 5 — After login and register, the backend returns:
 *            { accessToken: "eyJ...", user: { id, email, ... } }
 *          The previous code called setUser(response.data.user)
 *          but NEVER called setAccessToken(response.data.accessToken).
 *
 *          Result: the user object was set (UI looked logged-in),
 *          but every subsequent API call failed with 401 because
 *          the Authorization: Bearer header was never injected
 *          (axios.ts injects it from _accessToken, which was null).
 *
 *          Fix: call setAccessToken() immediately after every
 *          successful login / register response, before any
 *          other state update.
 *
 * Other improvements:
 *   - checkAuth now attempts a token refresh on load (silent re-login
 *     if the HttpOnly refresh cookie is still valid) instead of going
 *     straight to /me (which requires a valid access token).
 *   - logout clears the access token from memory before the API call.
 *   - CSRF fetch is centralised in one helper so it isn't duplicated
 *     in every function that needs it.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import api, { setAccessToken as setAxiosToken } from '@/lib/axios';
import {
  registerUnauthorizedHandler,
  clearUnauthorizedHandler,
  setAccessToken as setFetchToken,
} from '@/api/apiClient';
import type { User } from '@/types';

/**
 * localStorage key used to persist the access token across page reloads.
 * Mobile browsers aggressively kill background tabs; when the user returns
 * from their email app the page reloads, wiping all in-memory state.
 * Storing the token here lets the API clients rehydrate automatically.
 */
const TOKEN_STORAGE_KEY = 'stride_access_token';

/**
 * Sync the access token to BOTH API clients (Axios + fetch-based apiClient)
 * AND persist to localStorage so it survives mobile tab reloads.
 * AuthContext is the single source of truth for the JWT.
 */
function setAccessToken(token: string | null): void {
  setAxiosToken(token);
  setFetchToken(token);

  // Persist / clear
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, jobTitle?: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<User, 'email'>>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────────────────────
// Helper: fetch (or refresh) the CSRF cookie
// ─────────────────────────────────────────────────────────────
// GET /api/auth/csrf instructs the backend to:
//   1. Set the non-HttpOnly 'stride_csrf' cookie (used by older same-origin paths).
//   2. Return { csrfToken } in the response body.
// We write the token from the response body into <meta name="csrf-token">
// so that apiClient.ts (fetch-based) can read it at request time without
// relying on document.cookie — which does NOT work in production when the
// backend is on a different domain (e.g. Render) to the frontend.
const CSRF_META_NAME = 'csrf-token';

async function fetchCsrfToken(): Promise<void> {
  const res = await api.get<{ csrfToken: string }>('/api/auth/csrf');
  const token: string = res.data?.csrfToken ?? '';
  if (token) {
    const meta = document.querySelector<HTMLMetaElement>(
      `meta[name="${CSRF_META_NAME}"]`
    );
    if (meta) {
      meta.content = token;
    } else {
      // Fallback: create the tag if index.html somehow omitted it.
      const el = document.createElement('meta');
      el.name = CSRF_META_NAME;
      el.content = token;
      document.head.appendChild(el);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── 1. Silent re-login on app load ─────────────────────────
  // Attempts to exchange the HttpOnly refresh cookie for a new
  // access token. If successful, also fetches the user profile.
  // Falls back gracefully if the cookie is absent or expired.
  const checkAuth = useCallback(async () => {
    try {
      // Always initialise the CSRF cookie on load so it's ready
      // before the user interacts with anything.
      await fetchCsrfToken();

      // ── Rehydrate from localStorage first ──────────────────
      // On mobile, switching to the email app often kills the tab.
      // When the user returns the page reloads, wiping in-memory
      // tokens.  If a token was persisted in localStorage we can
      // restore it immediately so that API calls triggered before
      // the refresh completes (e.g. "Resend code") already have
      // a valid Authorization header.
      const persisted = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (persisted) {
        setAccessToken(persisted);
      }

      // Try to get a new access token via the refresh cookie.
      // This is a silent operation — no user interaction needed.
      const refreshRes = await api.post('/api/auth/refresh');
      const newAccessToken = refreshRes.data.accessToken as string;
      setAccessToken(newAccessToken);           // ← store in memory + localStorage

      // Now fetch the user profile with the fresh access token.
      const meRes = await api.get('/api/auth/me');
      setUser(meRes.data as User);
    } catch {
      // Refresh cookie absent or expired — user needs to log in.
      setAccessToken(null);  // also clears localStorage
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ── 2. Register — creates account and logs in for OTP verification ──
  // The backend now returns tokens on register (user needs to be
  // authenticated to call /verify-email).  After register, the
  // frontend redirects to /verify-email instead of the login form.
  const register = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    jobTitle?: string,
    bio?: string,
  ) => {
    try {
      await fetchCsrfToken();

      const response = await api.post('/api/auth/register', {
        email,
        password,
        fullName,
        jobTitle,
        bio,
      });

      const { accessToken, user: userData } = response.data as {
        accessToken: string;
        user: User;
      };
      setAccessToken(accessToken);
      setUser(userData);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Registration failed. Please try again.',
      };
    }
  }, []);

  // ── 3. Login ────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      await fetchCsrfToken();

      const response = await api.post('/api/auth/login', { email, password });

      // BUG 5 FIX: same as register — store the access token.
      const { accessToken, user: userData } = response.data as {
        accessToken: string;
        user: User;
      };
      setAccessToken(accessToken);   // ← was missing entirely
      setUser(userData);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Invalid email or password.',
      };
    }
  }, []);

  // ── 4. Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Keep the access token alive so the Bearer header is sent
      // and the backend can authenticate + revoke the session.
      await api.post('/api/auth/logout');
    } catch {
      // Best-effort — always clear local state even if the server call fails.
    } finally {
      // Clear token and state AFTER the API call completes.
      setAccessToken(null);  // also clears stride_access_token
      setUser(null);
      localStorage.removeItem('stride_tutorial_completed');
      localStorage.removeItem('wf_session');
      localStorage.removeItem('wf_projects');
    }
  }, []);

  // ── 5. Update profile ───────────────────────────────────────
  const updateProfile = useCallback(async (updates: Partial<Omit<User, 'email'>>) => {
    try {
      const response = await api.patch('/api/auth/me', updates);
      setUser(response.data as User);
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err; // Re-throw so the UI can show an error state
    }
  }, []);
  // ── 6. Delete account ─────────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    // Ensure a fresh CSRF token is available for the DELETE request
    await fetchCsrfToken();
    // Keep the access token alive for the request — if we clear it
    // first the Bearer header won't be sent and the backend returns 401.
    await api.delete('/api/auth/me');
    // Wipe all local session state AFTER the API call succeeds.
    setAccessToken(null);  // also clears stride_access_token
    setUser(null);
    localStorage.removeItem('stride_tutorial_completed');
    localStorage.removeItem('wf_session');
    localStorage.removeItem('wf_projects');
  }, []);
  // ── 401 handler ─────────────────────────────────────────────
  useEffect(() => {
    registerUnauthorizedHandler(logout);

    // Listen for the custom event dispatched by axios.ts when silent refresh fails
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      clearUnauthorizedHandler();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // ── 7. Verify email OTP ─────────────────────────────────────
  const verifyEmail = useCallback(async (code: string) => {
    try {
      await fetchCsrfToken();
      const response = await api.post('/api/auth/verify-email', { code });
      const { user: updatedUser } = response.data as { user: User };
      setUser(updatedUser);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Verification failed. Please try again.',
      };
    }
  }, []);

  // ── 8. Resend verification code ─────────────────────────────
  const resendVerification = useCallback(async () => {
    try {
      await fetchCsrfToken();
      await api.post('/api/auth/resend-verification');
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Failed to resend code. Please try again.',
      };
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, login, register, logout, updateProfile, deleteAccount, verifyEmail, resendVerification }),
    [user, loading, login, register, logout, updateProfile, deleteAccount, verifyEmail, resendVerification]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
