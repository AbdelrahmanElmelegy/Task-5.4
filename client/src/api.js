import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

// Cache the token for the current browser session.
let csrfToken = null;
let csrfTokenPromise = null;

// Automatically attach a CSRF token to every state-changing request.
api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();

  const mutatingMethods = ["post", "put", "patch", "delete"];

  if (!mutatingMethods.includes(method)) {
    return config;
  }

  // Fetch the token only when needed.
  if (!csrfToken) {
    if (!csrfTokenPromise) {
      csrfTokenPromise = api
        .get("/csrf-token")
        .then((response) => {
          csrfToken = response.data.csrfToken;
          return csrfToken;
        })
        .finally(() => {
          csrfTokenPromise = null;
        });
    }

    await csrfTokenPromise;
  }

  if (!csrfToken) {
    throw new Error("Unable to obtain CSRF token");
  }

  config.headers.set("x-csrf-token", csrfToken);

  return config;
});
