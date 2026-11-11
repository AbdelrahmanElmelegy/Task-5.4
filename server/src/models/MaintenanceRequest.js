import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'furniture', 'other'],
      required: true
    },
    description: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open'
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
