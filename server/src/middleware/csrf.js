import { doubleCsrf } from "csrf-csrf";

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.JWT_SECRET,

  cookieName: "csrf-token",

  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },

  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

export { generateToken, doubleCsrfProtection };
