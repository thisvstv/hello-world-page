/**
 * src/lib/axios.ts
 *
 * Central Axios instance for all STRIDE API calls.
 *
 * ── Bugs fixed vs. the previous version ──────────────────────
 *
 * BUG 1 — baseURL had '/api/v1' suffix that doesn't exist.
 *          Backend mounts routes under '/api' directly.
 *          Every request was hitting a 404.
 *
 * BUG 2 — CSRF cookie was read as 'xsrf-token'.
 *          Backend sets a cookie named 'stride_csrf'.
 *          (src/utils/auth.ts → CSRF_COOKIE_NAME = "stride_csrf")
 *          Token was always undefined → always missing from header.
 *
 * BUG 3 — CSRF header was sent as 'x-xsrf-token'.
 *          Backend reads 'x-csrf-token'.
 *          (src/utils/auth.ts → CSRF_HEADER_NAME = "x-csrf-token")
 *          Even if the token had been found, the header name mismatch
 *          meant the backend would never see it.
 *
 * BUG 4 — No Authorization header was ever injected.
 *          Every authenticated route (GET /api/auth/me, all projects,
 *          all notes) would return 401 silently.
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';

// ─────────────────────────────────────────────────────────────
// In-memory access token (primary) + localStorage fallback
// ─────────────────────────────────────────────────────────────
// Primary store is still in module scope for speed.
// localStorage (`stride_access_token`) serves as a persistence
// layer so the token survives mobile browser tab reloads.
// AuthContext manages writing to localStorage — this module
// only reads it as a fallback.
const TOKEN_STORAGE_KEY = 'stride_access_token';
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

/** Return the best available token: in-memory first, then localStorage. */
function resolveToken(): string | null {
  if (_accessToken) return _accessToken;
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (stored) {
    _accessToken = stored;  // rehydrate in-memory cache
  }
  return _accessToken;
}

// ─────────────────────────────────────────────────────────────
// CSRF constants — must match backend exactly
// src/utils/auth.ts: CSRF_COOKIE_NAME / CSRF_HEADER_NAME
// src/app.ts CORS config: allowedHeaders includes 'X-CSRF-Token'
// ─────────────────────────────────────────────────────────────
const CSRF_COOKIE_NAME = 'stride_csrf';   // BUG 2 FIX: was 'xsrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'; // BUG 3 FIX: was 'x-xsrf-token'

// HTTP methods that require a CSRF token (mirrors backend SAFE_METHODS exclusion)
const CSRF_REQUIRED = new Set(['post', 'put', 'patch', 'delete']);

/** Read a single cookie value by name from document.cookie. */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.split('=')[1]) : null;
}

// ─────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────
const api = axios.create({
  // BUG 1 FIX: removed the non-existent /api/v1 segment.
  // Set VITE_API_BASE_URL in .env for staging / production.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',

  // Required so the browser sends and receives cross-origin cookies:
  //   stride_csrf    — non-HttpOnly, readable by JS for the double-submit pattern
  //   stride_refresh — HttpOnly, sent automatically by the browser on /api/auth/refresh
  withCredentials: true,

  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  timeout: 15_000,
});

// ─────────────────────────────────────────────────────────────
// Request interceptor
// ─────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inject Bearer access token on all requests
    //    BUG 4 FIX: this block was entirely missing
    //    Now also falls back to localStorage so the token survives
    //    mobile tab reloads (e.g. VerifyEmail → email app → back).
    const token = resolveToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Remove default Content-Type for FormData uploads so the
    //    browser sets the correct multipart/form-data + boundary.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // 3. Inject CSRF token on mutating requests
    //    Primary: <meta name="csrf-token"> populated by AuthContext
    //    (works cross-origin where document.cookie can't see backend cookies).
    //    Fallback: stride_csrf cookie for same-origin / dev setups.
    const method = (config.method ?? 'get').toLowerCase();
    if (CSRF_REQUIRED.has(method)) {
      const metaCsrf =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
      const cookieCsrf = readCookie(CSRF_COOKIE_NAME);
      const token = metaCsrf || cookieCsrf;
      if (token) {
        config.headers[CSRF_HEADER_NAME] = token;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────
// Response interceptor with Silent Refresh Queue
// ─────────────────────────────────────────────────────────────
const FRIENDLY_FALLBACK = 'Something went wrong. Please try again.';

// State for token refresh queueing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger silent refresh if 401 Unauthorized, and we haven't already retried this request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Prevent infinite loops if the refresh endpoint itself returns 401
      if (originalRequest.url === '/api/auth/refresh') {
        setAccessToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Dispatch custom event so the app can redirect to login
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this failed request
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the backend refresh endpoint (uses HttpOnly cookie)
        const refreshRes = await api.post('/api/auth/refresh');
        const newToken = refreshRes.data.accessToken;

        setAccessToken(newToken);
        if (newToken) {
          localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        }

        // Apply new token to the queued requests
        processQueue(null, newToken);

        // Apply new token to the current request and retry it
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (expired refresh token, malicious tampering, etc.)
        processQueue(refreshError, null);
        setAccessToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Dispatch custom event to force user out
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise error.response.data.message to a user-safe string
    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;
      if (!data.message || typeof data.message !== 'string') {
        data.message = FRIENDLY_FALLBACK;
      }
    } else {
      // Network error or no response body
      error.response = error.response ?? { data: {} };
      error.response.data = { message: FRIENDLY_FALLBACK };
    }

    return Promise.reject(error);
  }
);

export default api;
