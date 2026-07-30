const DEFAULT_REDIRECT = "/dashboard";

/** Allow only same-origin relative paths (blocks open redirects). */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = DEFAULT_REDIRECT
): string {
  if (!next) return fallback;

  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("\\") || path.includes("@")) return fallback;

  try {
    const url = new URL(path, "http://localhost");
    if (url.origin !== "http://localhost") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
