import Joi from 'joi';
import { MaintenanceRequest } from '../models/MaintenanceRequest.js';

const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  category: Joi.string().valid('plumbing', 'electrical', 'furniture', 'other').required(),
  description: Joi.string().min(1).max(1000).required(),
  // the author is always the logged-in user, never taken from the body
  author: Joi.forbidden()
});

const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  category: Joi.string().valid('plumbing', 'electrical', 'furniture', 'other'),
  description: Joi.string().min(1).max(1000),
  status: Joi.string().valid('open', 'in_progress', 'resolved'),
  author: Joi.forbidden()
});

// GET /api/maintenance  (public list)
export async function getAllRequests(req, res, next) {
  try {
    const requests = await MaintenanceRequest.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ requests });
  } catch (err) { next(err); }
}

// GET /api/maintenance/:id
export async function getRequest(req, res, next) {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('author', 'name email');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ request });
  } catch (err) { next(err); }
}

// POST /api/maintenance  (auth)
export async function createRequest(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const doc = await MaintenanceRequest.create({ ...value, author: req.user.id });
    res.status(201).json({ request: doc });
  } catch (err) { next(err); }
}

// PATCH /api/maintenance/:id  (auth, own only)
export async function updateRequest(req, res, next) {
  try {
    const existing = await MaintenanceRequest.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Request not found' });
    if (existing.author?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own requests' });
    }

    const { value, error } = updateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );
    res.json({ request: doc });
  } catch (err) { next(err); }
}

// DELETE /api/maintenance/:id  (auth, own only)
export async function deleteRequest(req, res, next) {
  try {
    const existing = await MaintenanceRequest.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Request not found' });
    if (existing.author?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own requests' });
    }

    await existing.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
}
