import { parseDuration } from "./utils/duration.util.js";

/** Cookie names used by the API. */
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const GUEST_CART_COOKIE = "guest_cart_id";

export function accessCookieOptions(secure: boolean, sameSite: string) {
  return {
    httpOnly: true,
    secure,
    sameSite: sameSite as "lax" | "strict" | "none",
    path: "/",
    maxAge: parseDuration(process.env.JWT_ACCESS_TTL ?? "15m") * 1000,
  };
}

export function refreshCookieOptions(secure: boolean, sameSite: string) {
  return {
    httpOnly: true,
    secure,
    sameSite: sameSite as "lax" | "strict" | "none",
    path: "/api/auth",
    maxAge: parseDuration(process.env.JWT_REFRESH_TTL ?? "7d") * 1000,
  };
}

export function guestCartCookieOptions(secure: boolean, sameSite: string) {
  return {
    httpOnly: true,
    secure,
    sameSite: sameSite as "lax" | "strict" | "none",
    path: "/api",
    maxAge: 60 * 60 * 24 * 30 * 1000,
  };
}
