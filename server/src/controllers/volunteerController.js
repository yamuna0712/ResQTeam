import { Volunteer } from '../models/Volunteer.js';

export const getAllVolunteers = async (req, res) => {
  try {
    const { isAvailable, teamType } = req.query;
    const filter = {};
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (teamType) filter.teamType = teamType;

    const volunteers = await Volunteer.find(filter)
      .populate('currentIncident', 'emergencyType severity addressText')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerVolunteer = async (req, res) => {
  try {
    const { name, phone, teamType, latitude, longitude, capacity, equipment } = req.body;

    const coords = [Number(longitude), Number(latitude)];
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude required' });
    }

    const volunteer = await Volunteer.create({
      name,
      phone,
      teamType: teamType || 'GENERAL',
      location: {
        type: 'Point',
        coordinates: coords,
      },
      capacity: Number(capacity) || 4,
      equipment: equipment || ['First Aid Kit', 'Life Vests'],
      isAvailable: true,
      lastPingAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Rescue volunteer unit registered successfully',
      data: volunteer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVolunteerLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const coords = [Number(longitude), Number(latitude)];
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      return res.status(400).json({ success: false, message: 'Valid coordinates required' });
    }

    const updated = await Volunteer.findByIdAndUpdate(
      id,
      {
        location: { type: 'Point', coordinates: coords },
        lastPingAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Volunteer unit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Volunteer GPS beacon updated',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const updated = await Volunteer.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Volunteer status set to ${isAvailable ? 'AVAILABLE' : 'OFFLINE'}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
