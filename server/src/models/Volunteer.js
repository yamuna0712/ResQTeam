import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    teamType: {
      type: String,
      enum: [
        'BOAT_RESCUE',
        'MEDICAL',
        'EVACUATION',
        'AIRLIFT',
        'DRONE_SURVEILLANCE',
        'GENERAL',
      ],
      default: 'GENERAL',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    capacity: {
      type: Number,
      default: 4, // Max people that can be evacuated per trip
    },
    equipment: {
      type: [String],
      default: ['First Aid Kit', 'Life Vests', 'Satellite Phone'],
    },
    currentIncident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SOSRequest',
      default: null,
    },
    lastPingAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial proximity search
volunteerSchema.index({ location: '2dsphere' });
volunteerSchema.index({ isAvailable: 1, teamType: 1 });

export const Volunteer = mongoose.model('Volunteer', volunteerSchema);
