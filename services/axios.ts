import axios, { isAxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
const headers = {
  "Content-Type": "application/json",
  // Tells the API to use the admin session, separate from the main app's.
  "x-ticketer-app": "admin",
};

const Axios = axios.create({ baseURL, withCredentials: true, headers });

/*
 * Session expiry → /login?next=<this page>, so the admin lands back where
 * they were after signing in (the login page checks `next` with
 * safeNextPath).
 *
 * The API answers a request without a live session with 403 "Forbidden
 * resource", the same as a role it won't serve, not with 401. So on a 403
 * we ask /v1/auth/me whether the session is still alive: if it isn't, it's
 * an expired session; if it is, it's a real permission error and the
 * caller shows it.
 */

let sessionProbe: Promise<boolean> | null = null;

/** One probe at a time, however many requests failed together. */
function sessionAlive(): Promise<boolean> {
  sessionProbe ??= axios
    .get(`${baseURL ?? ""}/v1/auth/me`, { withCredentials: true, headers })
    .then(
      () => true,
      (error) => !(isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)),
    )
    .finally(() => {
      setTimeout(() => (sessionProbe = null), 1_000);
    });
  return sessionProbe;
}

function goToLogin() {
  const here = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(here)}`;
}

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const onLoginPage =
      typeof window === "undefined" || window.location.pathname.startsWith("/login");
    const isProbe = isAxiosError(error) && error.config?.url?.endsWith("auth/me");

    if (!onLoginPage && !isProbe) {
      if (status === 401) goToLogin();
      else if (status === 403 && !(await sessionAlive())) goToLogin();
    }
    return Promise.reject(error);
  },
);

export default Axios;
