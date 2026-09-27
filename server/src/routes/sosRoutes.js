import express from 'express';
import {
  bulkSyncSOS,
  createSOS,
  getAllSOS,
  getSOSById,
  getNearestResponders,
  updateSOSStatus,
  getTelemetryStats,
} from '../controllers/sosController.js';

const router = express.Router();

// Bulk ingestion endpoint for offline store-and-forward sync
router.post('/bulk-sync', bulkSyncSOS);

// System telemetry & analytics
router.get('/telemetry', getTelemetryStats);

// Standard CRUD & Geospatial queries
router.post('/', createSOS);
router.get('/', getAllSOS);
router.get('/:id', getSOSById);
router.get('/:id/nearest-responders', getNearestResponders);
router.patch('/:id/status', updateSOSStatus);

export default router;
