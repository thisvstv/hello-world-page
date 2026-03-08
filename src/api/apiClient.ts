// ── API Client ─────────────────────────────────────────
// Thin wrapper over `fetch` with interceptors for auth tokens,
// base URL, CSRF protection, and standard error handling.
// Swap VITE_API_BASE_URL in .env to point at a real server.

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

// ── Security: HTTPS enforcement in production ──────────
// Prevents accidental plaintext API calls in deployed environments.
if (
    import.meta.env.PROD &&
    API_BASE_URL &&
    !API_BASE_URL.startsWith("https://")
) {
    throw new Error(
        `[Security] API_BASE_URL must use HTTPS in production. Got: "${API_BASE_URL}"`
    );
}

// ── Token management ───────────────────────────────────
// Primary store is in-memory; localStorage is a persistence
// fallback so the token survives mobile tab reloads.
const TOKEN_STORAGE_KEY = 'stride_access_token';
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

/** Return the best available token: in-memory first, then localStorage. */
function resolveToken(): string | null {
    if (accessToken) return accessToken;
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
        accessToken = stored; // rehydrate in-memory cache
    }
    return accessToken;
}

// ── Global 401 listener ────────────────────────────────
// Register a callback (e.g. auth context logout) that fires
// whenever a 401 Unauthorized is received from the API.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Call once at app init (e.g. in AuthProvider) to wire up
 *  automatic logout on 401. */
export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
    onUnauthorized = handler;
}

export function clearUnauthorizedHandler() {
    onUnauthorized = null;
}

// ── Error class ────────────────────────────────────────
export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(status: number, message: string, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

// ── Core request function ──────────────────────────────
type RequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    /** Skip the default JSON parse (e.g. for 204 No Content) */
    raw?: boolean;
};

async function request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
): Promise<T> {
    const { body, raw, headers: customHeaders, ...rest } = options;

    // ── Build headers with auth, CSRF & security interceptors ──
    const headers = new Headers(customHeaders);

    // Always enforce strict JSON content type for requests with a body.
    // This prevents MIME-confusion attacks where a server might interpret
    // a request body as a different content type (e.g. multipart/form-data).
    if (body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    // Accept JSON responses.
    headers.set("Accept", "application/json");

    const token = resolveToken();
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // ── CSRF Protection ──────────────────────────────────
    // Primary source: <meta name="csrf-token"> populated by AuthContext
    // after every GET /api/auth/csrf call. This works in both local dev
    // and cross-origin production (where document.cookie won't contain
    // the backend's stride_csrf cookie because it's a different domain).
    //
    // Fallback: read directly from document.cookie for same-origin setups
    // or for any code path that bypasses AuthContext.
    const metaCsrf =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
    const cookieCsrf = (() => {
        const entry = document.cookie
            .split("; ")
            .find((row) => row.startsWith("stride_csrf="));
        return entry ? decodeURIComponent(entry.split("=")[1]) : "";
    })();
    const csrfToken = metaCsrf || cookieCsrf;
    if (csrfToken) {
        headers.set("X-CSRF-Token", csrfToken);
    }

    // ── Make the request ─────────────────────────────────

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...rest,
        headers,
        credentials: "include", // send cookies for session / CSRF
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // ── Response interceptor ─────────────────────────────
    if (!res.ok) {
        // ── 401 Unauthorized → trigger global logout ─────
        if (res.status === 401) {
            // Clear the token so no subsequent requests go out
            accessToken = null;
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            // Notify the auth layer (logout, redirect, etc.)
            onUnauthorized?.();
        }

        let errBody: unknown;
        try {
            errBody = await res.json();
        } catch {
            errBody = await res.text();
        }

        // Extract the user-friendly message from the backend’s
        // error response. The backend masks non-operational errors
        // in production, so this should always be safe for display.
        // If no message exists, fall back to a generic string.
        const FRIENDLY_FALLBACK = "Something went wrong. Please try again.";
        const friendlyMessage =
            errBody &&
                typeof errBody === "object" &&
                "message" in (errBody as Record<string, unknown>) &&
                typeof (errBody as Record<string, unknown>).message === "string"
                ? ((errBody as Record<string, unknown>).message as string)
                : FRIENDLY_FALLBACK;

        throw new ApiError(res.status, friendlyMessage, errBody);
    }

    if (raw || res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
}

// ── Convenience methods ────────────────────────────────
export const apiClient = {
    get<T = unknown>(endpoint: string, opts?: RequestOptions) {
        return request<T>(endpoint, { ...opts, method: "GET" });
    },
    post<T = unknown>(endpoint: string, body?: unknown, opts?: RequestOptions) {
        return request<T>(endpoint, { ...opts, method: "POST", body });
    },
    put<T = unknown>(endpoint: string, body?: unknown, opts?: RequestOptions) {
        return request<T>(endpoint, { ...opts, method: "PUT", body });
    },
    patch<T = unknown>(endpoint: string, body?: unknown, opts?: RequestOptions) {
        return request<T>(endpoint, { ...opts, method: "PATCH", body });
    },
    delete<T = unknown>(endpoint: string, opts?: RequestOptions) {
        return request<T>(endpoint, { ...opts, method: "DELETE", raw: true });
    },
};

export default apiClient;
