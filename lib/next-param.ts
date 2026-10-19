const FALLBACK = "/";

/**
 * Where to send someone after they sign in. Only same-origin relative paths
 * pass: a single leading "/", no scheme, no "//" or "/\" (browsers treat both
 * as protocol-relative), no whitespace or control characters, and never back
 * to /login itself.
 */
export function safeNextPath(next: string | null): string {
  if (!next) return FALLBACK;
  if (!next.startsWith("/")) return FALLBACK;
  if (next.startsWith("//") || next.startsWith("/\\")) return FALLBACK;
  // Tabs, newlines and other control characters are stripped by URL parsers,
  // so "/\t/evil.com" would become "//evil.com". Reject them outright.
  if (/[\u0000-\u001f\u007f\s\\]/.test(next)) return FALLBACK;

  const path = next.split(/[?#]/, 1)[0];
  if (path === "/login" || path.startsWith("/login/")) return FALLBACK;

  return next;
}
