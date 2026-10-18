import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

const Axios = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // Tells the API to use the admin session, separate from the main app's.
    "x-ticketer-app": "admin",
  },
});

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default Axios;
