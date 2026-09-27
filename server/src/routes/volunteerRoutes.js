import express from 'express';
import {
  getAllVolunteers,
  registerVolunteer,
  updateVolunteerLocation,
  toggleAvailability,
} from '../controllers/volunteerController.js';

const router = express.Router();

router.get('/', getAllVolunteers);
router.post('/', registerVolunteer);
router.patch('/:id/location', updateVolunteerLocation);
router.patch('/:id/availability', toggleAvailability);

export default router;
