import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { requireAuth } from "../middleware/auth.js";
import { doubleCsrfProtection } from "../middleware/csrf.js";

import {
  getAllRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
} from "../controllers/maintenanceController.js";

const router = Router();

// DoS protection: limit each client to 20 requests per 15 minutes.
const maintenanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many maintenance requests. Please try again later.",
  },
});

// Apply rate limiting to every maintenance endpoint.
router.use(maintenanceLimiter);

// GET requests are safe and do not require CSRF tokens.
router.get("/", getAllRequests);
router.get("/:id", getRequest);

// Every state-changing request requires authentication and CSRF validation.
router.post("/", requireAuth, doubleCsrfProtection, createRequest);
router.patch("/:id", requireAuth, doubleCsrfProtection, updateRequest);
router.delete("/:id", requireAuth, doubleCsrfProtection, deleteRequest);

export default router;
