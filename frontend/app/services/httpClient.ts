const API_BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

type ErrorPayload = { message?: string | string[] };

/** Normalized API failure thrown by every service call. */
export class ApiError extends Error {
  readonly status: number | "FETCH_ERROR";
  readonly payload: unknown;

  constructor(status: number | "FETCH_ERROR", payload: unknown) {
    super(extractMessage(payload) ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const message = (payload as ErrorPayload).message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message) return message;
  return undefined;
}

/**
 * The API wraps every success body as `{ data: <payload> }`.
 * Unwrap it so service return types (`User`, `Cart`, `HomeData`, ...) match runtime.
 */
function unwrapEnvelope(body: unknown): unknown {
  if (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "data" in body &&
    Object.keys(body).length === 1
  ) {
    return (body as { data: unknown }).data;
  }
  return body;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

/** Serialize query params, dropping empty values. */
export function qs(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

let refreshPromise: Promise<boolean> | null = null;

/** Single-flight session refresh used after a 401. */
function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function fetchOnce(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("FETCH_ERROR", {
      message: "Network error — is the API running?",
    });
  }
}

/**
 * Perform an API request against the `{ data }` envelope:
 * unwraps success bodies, transparently refreshes expired sessions once,
 * and throws `ApiError` on failure.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let res = await fetchOnce(path, init);

  const isAuthCall = path.startsWith("/auth/");
  if (res.status === 401 && !isAuthCall && (await tryRefresh())) {
    res = await fetchOnce(path, init);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await safeJson(res));
  }
  return unwrapEnvelope(await safeJson(res)) as T;
}

/** Convenience verbs used by the domain services. */
export const http = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: "POST", body: formData }),
};
