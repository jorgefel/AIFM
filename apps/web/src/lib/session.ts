const SESSION_HINT_KEY = "aifm_session";
const SESSION_HINT_COOKIE = "session_hint";

export function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;

  if (localStorage.getItem(SESSION_HINT_KEY) === "1") {
    return true;
  }

  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${SESSION_HINT_COOKIE}=1`));
}

export function setSessionHint(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_HINT_KEY, "1");
}

export function clearSessionHint(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_HINT_KEY);
}

export function isPublicAuthRoute(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path === "/login" || path === "/register";
}
