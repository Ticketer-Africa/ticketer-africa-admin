export type ApiEnvironment = "production" | "staging" | "local";

/** Which backend this build talks to, so staff never mistake staging for live. */
export function apiEnvironment(
  baseUrl: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL,
): ApiEnvironment {
  if (!baseUrl) return "local";
  if (/localhost|127\.0\.0\.1|\[::1\]/.test(baseUrl)) return "local";
  if (/staging/i.test(baseUrl)) return "staging";
  return "production";
}
