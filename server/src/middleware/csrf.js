import { doubleCsrf } from "csrf-csrf";

const { generateCsrfToken: generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.JWT_SECRET,

  getSessionIdentifier: (req) => req.cookies?.token || req.ip || "anonymous",

  cookieName: "csrf-token",

  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },

  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

export { generateToken, doubleCsrfProtection };
