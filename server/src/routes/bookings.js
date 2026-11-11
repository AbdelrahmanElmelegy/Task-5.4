import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} from '../controllers/bookingController.js';

const router = Router();

// Reading is public; writing requires a logged-in user.
router.get('/', getAllBookings);
router.get('/:id', getBooking);
router.post('/', requireAuth, createBooking);
router.patch('/:id', requireAuth, updateBooking);
router.delete('/:id', requireAuth, deleteBooking);

export default router;
