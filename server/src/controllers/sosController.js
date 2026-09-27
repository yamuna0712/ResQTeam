import { SOSRequest } from '../models/SOSRequest.js';
import { Volunteer } from '../models/Volunteer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bulk Ingestion API for Offline-First Sync
 * Uses MongoDB bulkWrite({ ordered: false }) with upsert on clientRequestId
 * Prevents duplicates when retrying network syncs
 */
export const bulkSyncSOS = async (req, res) => {
  const startTime = Date.now();
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payload must contain a non-empty "requests" array',
      });
    }

    const now = new Date();

    // Prepare bulkWrite operations
    const bulkOperations = requests.map((item) => {
      const clientRequestId = item.clientRequestId || uuidv4();
      const coords = item.location?.coordinates || [item.longitude, item.latitude];

      if (!coords || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        throw new Error(`Invalid GeoJSON coordinates for request ${clientRequestId}`);
      }

      return {
        updateOne: {
          filter: { clientRequestId },
          update: {
            $setOnInsert: {
              clientRequestId,
              citizenName: item.citizenName || 'Anonymous Citizen',
              contactNumber: item.contactNumber || '',
              location: {
                type: 'Point',
                coordinates: [Number(coords[0]), Number(coords[1])], // [lng, lat]
              },
              addressText: item.addressText || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`,
              emergencyType: item.emergencyType || 'TRAPPED',
              severity: item.severity || 'HIGH',
              peopleCount: Number(item.peopleCount) || 1,
              vulnerableDetails: {
                infants: Number(item.vulnerableDetails?.infants) || 0,
                elderly: Number(item.vulnerableDetails?.elderly) || 0,
                injured: Number(item.vulnerableDetails?.injured) || 0,
              },
              notes: item.notes || '',
              offlineCreatedAt: item.offlineCreatedAt ? new Date(item.offlineCreatedAt) : now,
              syncedAt: now,
              status: item.status || 'PENDING',
            },
          },
          upsert: true,
        },
      };
    });

    // Execute bulkWrite with ordered: false for maximum throughput & fault tolerance
    const bulkResult = await SOSRequest.bulkWrite(bulkOperations, { ordered: false });
    const durationMs = Date.now() - startTime;

    console.log(
      `[Bulk Ingest] Processed ${requests.length} records in ${durationMs}ms: ` +
      `Upserted=${bulkResult.upsertedCount}, Matched=${bulkResult.matchedCount}`
    );

    // Fetch the stored requests to return up-to-date state
    const clientIds = requests.map((r) => r.clientRequestId).filter(Boolean);
    const savedRecords = await SOSRequest.find({ clientRequestId: { $in: clientIds } });

    res.status(200).json({
      success: true,
      message: `Bulk sync complete. Ingested ${requests.length} records in ${durationMs}ms.`,
      stats: {
        totalReceived: requests.length,
        upsertedCount: bulkResult.upsertedCount,
        matchedCount: bulkResult.matchedCount,
        modifiedCount: bulkResult.modifiedCount,
        durationMs,
      },
      data: savedRecords,
    });
  } catch (error) {
    console.error('[Bulk Ingest Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest bulk SOS records',
      error: error.message,
    });
  }
};

/**
 * Single SOS creation (Direct Online Mode)
 */
export const createSOS = async (req, res) => {
  try {
    const {
      citizenName,
      contactNumber,
      latitude,
      longitude,
      addressText,
      emergencyType,
      severity,
      peopleCount,
      vulnerableDetails,
      notes,
      clientRequestId,
    } = req.body;

    const coords = [Number(longitude), Number(latitude)];
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude required' });
    }

    const newRequest = await SOSRequest.create({
      clientRequestId: clientRequestId || uuidv4(),
      citizenName: citizenName || 'Anonymous Citizen',
      contactNumber: contactNumber || '',
      location: {
        type: 'Point',
        coordinates: coords,
      },
      addressText: addressText || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      emergencyType: emergencyType || 'TRAPPED',
      severity: severity || 'HIGH',
      peopleCount: Number(peopleCount) || 1,
      vulnerableDetails: vulnerableDetails || { infants: 0, elderly: 0, injured: 0 },
      notes: notes || '',
      offlineCreatedAt: new Date(),
      syncedAt: new Date(),
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'SOS distress signal transmitted successfully',
      data: newRequest,
    });
  } catch (error) {
    console.error('[Create SOS Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all SOS incidents with optional status/severity filters
 */
export const getAllSOS = async (req, res) => {
  try {
    const { status, severity, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const incidents = await SOSRequest.find(filter)
      .populate('assignedVolunteer', 'name phone teamType capacity location')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get SOS incident by ID
 */
export const getSOSById = async (req, res) => {
  try {
    const incident = await SOSRequest.findById(req.params.id).populate('assignedVolunteer');
    if (!incident) {
      return res.status(404).json({ success: false, message: 'SOS incident not found' });
    }
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Geospatial Matching Engine:
 * Finds nearest active rescue volunteers to a specific SOS incident using MongoDB 2dsphere $geoNear
 */
export const getNearestResponders = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDistanceKm = 50, limit = 5 } = req.query;

    const incident = await SOSRequest.findById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'SOS Incident not found' });
    }

    const [longitude, latitude] = incident.location.coordinates;
    const maxDistanceMeters = Number(maxDistanceKm) * 1000;

    // Execute MongoDB 2dsphere $geoNear aggregation
    const nearestResponders = await Volunteer.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceMeters',
          spherical: true,
          query: { isAvailable: true },
          maxDistance: maxDistanceMeters,
        },
      },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
        },
      },
      {
        $sort: { distanceMeters: 1 },
      },
      {
        $limit: Number(limit),
      },
    ]);

    res.status(200).json({
      success: true,
      incident: {
        id: incident._id,
        emergencyType: incident.emergencyType,
        severity: incident.severity,
        coordinates: incident.location.coordinates,
        peopleCount: incident.peopleCount,
      },
      nearestResponders,
    });
  } catch (error) {
    console.error('[Geospatial Matching Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update SOS status (Dispatch volunteer / mark in-progress / resolved)
 */
export const updateSOSStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, volunteerId } = req.body;

    const updateData = {};
    if (status) updateData.status = status;

    if (volunteerId) {
      updateData.assignedVolunteer = volunteerId;
      // Mark volunteer as busy
      await Volunteer.findByIdAndUpdate(volunteerId, {
        isAvailable: status === 'RESOLVED',
        currentIncident: status === 'RESOLVED' ? null : id,
      });
    } else if (status === 'RESOLVED') {
      const existing = await SOSRequest.findById(id);
      if (existing && existing.assignedVolunteer) {
        await Volunteer.findByIdAndUpdate(existing.assignedVolunteer, {
          isAvailable: true,
          currentIncident: null,
        });
      }
    }

    const updated = await SOSRequest.findByIdAndUpdate(id, updateData, { new: true }).populate(
      'assignedVolunteer'
    );

    res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * System telemetry & stats
 */
export const getTelemetryStats = async (req, res) => {
  try {
    const [totalIncidents, pending, dispatched, resolved, critical] = await Promise.all([
      SOSRequest.countDocuments(),
      SOSRequest.countDocuments({ status: 'PENDING' }),
      SOSRequest.countDocuments({ status: 'DISPATCHED' }),
      SOSRequest.countDocuments({ status: 'RESOLVED' }),
      SOSRequest.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } }),
    ]);

    const activeResponders = await Volunteer.countDocuments({ isAvailable: true });
    const totalResponders = await Volunteer.countDocuments();

    // Calculate total people rescued and still stranded
    const peopleStats = await SOSRequest.aggregate([
      {
        $group: {
          _id: '$status',
          totalPeople: { $sum: '$peopleCount' },
        },
      },
    ]);

    const peopleMap = {};
    peopleStats.forEach((p) => {
      peopleMap[p._id] = p.totalPeople;
    });

    res.status(200).json({
      success: true,
      telemetry: {
        totalIncidents,
        pendingIncidents: pending,
        dispatchedIncidents: dispatched,
        resolvedIncidents: resolved,
        criticalIncidents: critical,
        activeResponders,
        totalResponders,
        strandedPeopleCount: (peopleMap['PENDING'] || 0) + (peopleMap['DISPATCHED'] || 0),
        rescuedPeopleCount: peopleMap['RESOLVED'] || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
