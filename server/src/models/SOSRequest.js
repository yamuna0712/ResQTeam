import mongoose from 'mongoose';

const sosRequestSchema = new mongoose.Schema(
  {
    clientRequestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    citizenName: {
      type: String,
      default: 'Anonymous Citizen',
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - strictly GeoJSON specification
        required: true,
      },
    },
    addressText: {
      type: String,
      default: 'Unknown coordinates',
    },
    emergencyType: {
      type: String,
      enum: [
        'TRAPPED',
        'MEDICAL_CRITICAL',
        'FLOOD_RISING',
        'FIRE',
        'FOOD_WATER',
        'INFRASTRUCTURE_COLLAPSE',
      ],
      default: 'TRAPPED',
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    peopleCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    vulnerableDetails: {
      infants: { type: Number, default: 0 },
      elderly: { type: Number, default: 0 },
      injured: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED'],
      default: 'PENDING',
      index: true,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    offlineCreatedAt: {
      type: Date,
      default: Date.now,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for ultra-fast geospatial calculations and proximity matching
sosRequestSchema.index({ location: '2dsphere' });
sosRequestSchema.index({ status: 1, severity: 1 });

export const SOSRequest = mongoose.model('SOSRequest', sosRequestSchema);
