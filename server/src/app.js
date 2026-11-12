import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { generateToken } from "./middleware/csrf.js";

import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
import userRoutes from "./routes/users.js";
import maintenanceRoutes from "./routes/maintenance.js";

const app = express();

app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://localhost:5175",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Issue a CSRF token to the legitimate client.
app.get("/api/csrf-token", (req, res) => {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
});

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

export default app;
