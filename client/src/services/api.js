import { saveSOSToIndexedDB, getCachedIncidents, cacheIncidentsLocally } from '../db/indexedDB.js';

const API_BASE = '/api';

export const submitSOS = async (sosPayload, isOnline) => {
  // If explicitly offline or offline simulator enabled, store directly in IndexedDB
  if (!isOnline) {
    const saved = await saveSOSToIndexedDB(sosPayload);
    return {
      success: true,
      queuedOffline: true,
      message: 'DISTRESS SIGNAL SAVED TO LOCAL INDEXEDDB. Queued for auto-sync.',
      data: saved,
    };
  }

  // Attempt online transmission
  try {
    const res = await fetch(`${API_BASE}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sosPayload),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      queuedOffline: false,
      message: 'SOS signal delivered to Command Center via high-speed grid.',
      data: data.data,
    };
  } catch (err) {
    console.warn('[API] Online POST failed. Falling back to offline IndexedDB queue:', err.message);
    const saved = await saveSOSToIndexedDB(sosPayload);
    return {
      success: true,
      queuedOffline: true,
      message: 'Network dropped during transmission. Cached to IndexedDB store.',
      data: saved,
    };
  }
};

export const syncBulkSOS = async (queuedRequests) => {
  if (!queuedRequests || queuedRequests.length === 0) {
    return { success: true, count: 0 };
  }

  const res = await fetch(`${API_BASE}/sos/bulk-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: queuedRequests }),
  });

  if (!res.ok) {
    throw new Error(`Bulk sync failed with status ${res.status}`);
  }

  return await res.json();
};

export const getIncidents = async (isOnline, filters = {}) => {
  if (!isOnline) {
    const cached = await getCachedIncidents();
    return { success: true, data: cached, isOfflineCache: true };
  }

  try {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/sos${params ? '?' + params : ''}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    const data = await res.json();
    // Cache fresh incidents into local IndexedDB
    await cacheIncidentsLocally(data.data);
    return { success: true, data: data.data, isOfflineCache: false };
  } catch (err) {
    console.warn('[API] Could not reach server, reading cached incidents from IndexedDB:', err);
    const cached = await getCachedIncidents();
    return { success: true, data: cached, isOfflineCache: true };
  }
};

export const getVolunteers = async () => {
  try {
    const res = await fetch(`${API_BASE}/volunteers`);
    if (!res.ok) throw new Error('Failed to fetch volunteers');
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.warn('[API] Volunteer fetch failed:', err);
    return [];
  }
};

export const getNearestResponders = async (incidentId, maxDistanceKm = 50) => {
  const res = await fetch(`${API_BASE}/sos/${incidentId}/nearest-responders?maxDistanceKm=${maxDistanceKm}`);
  if (!res.ok) throw new Error('Failed to execute geospatial query');
  return await res.json();
};

export const updateIncidentStatus = async (incidentId, status, volunteerId = null) => {
  const res = await fetch(`${API_BASE}/sos/${incidentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, volunteerId }),
  });
  if (!res.ok) throw new Error('Status update failed');
  return await res.json();
};

export const fetchTelemetryStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/sos/telemetry`);
    if (!res.ok) throw new Error('Failed to load telemetry');
    const data = await res.json();
    return data.telemetry;
  } catch (err) {
    return null;
  }
};

export const DEFAULT_DEMO_INCIDENTS = [
  {
    _id: 'demo-inc-1',
    clientRequestId: 'demo-client-1',
    citizenName: 'Priya Sharma & Family',
    contactNumber: '+91 91234 56789',
    location: { type: 'Point', coordinates: [72.8857, 19.0810] },
    addressText: 'Building 14, 2nd Floor, Submerged Courtyard, Kurla West',
    emergencyType: 'FLOOD_RISING',
    severity: 'CRITICAL',
    peopleCount: 4,
    vulnerableDetails: { infants: 1, elderly: 2, injured: 0 },
    notes: 'Water level reached 1st floor balcony and rising rapidly. Power grid severed. Infant needs warm milk.',
    status: 'PENDING',
    offlineCreatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  },
  {
    _id: 'demo-inc-2',
    clientRequestId: 'demo-client-2',
    citizenName: 'Ramesh Patel',
    contactNumber: '+91 92345 67890',
    location: { type: 'Point', coordinates: [72.8657, 19.0880] },
    addressText: 'Shop No. 7, Near Old Post Office, Dharavi Junction',
    emergencyType: 'MEDICAL_CRITICAL',
    severity: 'CRITICAL',
    peopleCount: 1,
    vulnerableDetails: { infants: 0, elderly: 1, injured: 1 },
    notes: 'Severe compound fracture after masonry collapse. Heavy bleeding, conscious but fading.',
    status: 'PENDING',
    offlineCreatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  },
  {
    _id: 'demo-inc-3',
    clientRequestId: 'demo-client-3',
    citizenName: 'Kavita Deshmukh',
    contactNumber: '+91 93456 78901',
    location: { type: 'Point', coordinates: [72.8957, 19.0660] },
    addressText: 'Shree Ganesh Co-op Housing Society, Rooftop terrace',
    emergencyType: 'TRAPPED',
    severity: 'HIGH',
    peopleCount: 6,
    vulnerableDetails: { infants: 0, elderly: 1, injured: 0 },
    notes: 'Trapped on terrace with 6 neighbors. Ground floors inundated. No drinking water left.',
    status: 'PENDING',
    offlineCreatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  },
  {
    _id: 'demo-inc-4',
    clientRequestId: 'demo-client-4',
    citizenName: 'Anil Verma',
    contactNumber: '+91 94567 89012',
    location: { type: 'Point', coordinates: [72.8727, 19.0670] },
    addressText: 'Plot 42, Industrial Area Gate 3',
    emergencyType: 'FOOD_WATER',
    severity: 'MEDIUM',
    peopleCount: 8,
    vulnerableDetails: { infants: 2, elderly: 0, injured: 0 },
    notes: 'Group of factory workers stranded on high platform. Safe from water but stranded without food.',
    status: 'PENDING',
    offlineCreatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  },
];

export const DEFAULT_DEMO_VOLUNTEERS = [
  {
    _id: 'demo-vol-1',
    name: 'Rapid Flood Boat Unit 01',
    phone: '+91 98201 11223',
    teamType: 'BOAT_RESCUE',
    location: { type: 'Point', coordinates: [72.8897, 19.0840] },
    capacity: 6,
    equipment: ['Zodiac Inflatable Boat', 'Rescue Throw Bags', 'Spotlights', 'Life Vests'],
    isAvailable: true,
  },
  {
    _id: 'demo-vol-2',
    name: 'Disaster Paramedic Team Alpha',
    phone: '+91 98202 33445',
    teamType: 'MEDICAL',
    location: { type: 'Point', coordinates: [72.8627, 19.0860] },
    capacity: 2,
    equipment: ['Trauma First Aid Kit', 'Portable Defibrillator', 'Oxygen Tanks'],
    isAvailable: true,
  },
  {
    _id: 'demo-vol-3',
    name: 'Air & Rooftop Rescue Squadron',
    phone: '+91 98203 55667',
    teamType: 'AIRLIFT',
    location: { type: 'Point', coordinates: [72.9177, 19.0510] },
    capacity: 8,
    equipment: ['Winch Harness', 'Aero Stretcher', 'Helicopter Radio'],
    isAvailable: true,
  },
  {
    _id: 'demo-vol-4',
    name: 'Drone Reconnaissance Unit 02',
    phone: '+91 98205 99001',
    teamType: 'DRONE_SURVEILLANCE',
    location: { type: 'Point', coordinates: [72.8827, 19.0710] },
    capacity: 0,
    equipment: ['Thermal Imaging Drone', 'Loudspeaker', 'Transponders'],
    isAvailable: true,
  },
];

export const triggerSeed = async () => {
  try {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
    throw new Error(`Server status ${res.status}`);
  } catch (err) {
    console.warn('[API] Backend seed unreachable. Activating local demo hotspots fallback:', err.message);
    await cacheIncidentsLocally(DEFAULT_DEMO_INCIDENTS);
    return {
      success: true,
      message: 'Demo emergency hotspots loaded into tactical cache',
      result: {
        incidentsCount: DEFAULT_DEMO_INCIDENTS.length,
        volunteersCount: DEFAULT_DEMO_VOLUNTEERS.length,
        incidents: DEFAULT_DEMO_INCIDENTS,
        volunteers: DEFAULT_DEMO_VOLUNTEERS,
      },
    };
  }
};

