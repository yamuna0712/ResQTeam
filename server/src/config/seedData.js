import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './db.js';
import { SOSRequest } from '../models/SOSRequest.js';
import { Volunteer } from '../models/Volunteer.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Reference Center: Coastal Urban Disaster Zone (Mumbai / Coastal Area: 19.0760° N, 72.8777° E)
const BASE_LAT = 19.0760;
const BASE_LNG = 72.8777;

export const getSampleVolunteers = () => [
  {
    name: 'Rapid Flood Boat Unit 01',
    phone: '+91 98201 11223',
    teamType: 'BOAT_RESCUE',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.012, BASE_LAT + 0.008] }, // ~1.5 km away
    capacity: 6,
    equipment: ['Zodiac Inflatable Boat', 'Rescue Throw Bags', 'High-Lumen Spotlights', 'Life Vests'],
    isAvailable: true,
  },
  {
    name: 'Disaster Paramedic Team Alpha',
    phone: '+91 98202 33445',
    teamType: 'MEDICAL',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.015, BASE_LAT + 0.010] }, // ~2.1 km away
    capacity: 2,
    equipment: ['Trauma First Aid Kit', 'Portable Defibrillator', 'Oxygen Tanks', 'Stretchers'],
    isAvailable: true,
  },
  {
    name: 'Air & Rooftop Rescue Squadron',
    phone: '+91 98203 55667',
    teamType: 'AIRLIFT',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.040, BASE_LAT - 0.025] }, // ~5.2 km away
    capacity: 8,
    equipment: ['Winch Harness', 'Aero Stretcher', 'Helicopter Radio Comms'],
    isAvailable: true,
  },
  {
    name: 'Community Evacuation Truck #4',
    phone: '+91 98204 77889',
    teamType: 'EVACUATION',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.025, BASE_LAT - 0.018] }, // ~3.6 km away
    capacity: 15,
    equipment: ['High-Clearance 4x4 Truck', 'Rations', 'Clean Drinking Water Cans'],
    isAvailable: true,
  },
  {
    name: 'Drone Reconnaissance Unit 02',
    phone: '+91 98205 99001',
    teamType: 'DRONE_SURVEILLANCE',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.005, BASE_LAT - 0.005] }, // ~0.8 km away
    capacity: 0,
    equipment: ['Thermal Imaging Drone', 'Loudspeaker Payload', 'GPS Transponder Drops'],
    isAvailable: true,
  },
];

export const getSampleIncidents = () => [
  {
    clientRequestId: uuidv4(),
    citizenName: 'Priya Sharma & Family',
    contactNumber: '+91 91234 56789',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.008, BASE_LAT + 0.005] },
    addressText: 'Building 14, 2nd Floor, Submerged Courtyard, Kurla West',
    emergencyType: 'FLOOD_RISING',
    severity: 'CRITICAL',
    peopleCount: 4,
    vulnerableDetails: { infants: 1, elderly: 2, injured: 0 },
    notes: 'Water level reached 1st floor balcony and rising rapidly. Power grid severed. Infant needs warm milk.',
    status: 'PENDING',
    offlineCreatedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    syncedAt: new Date(),
  },
  {
    clientRequestId: uuidv4(),
    citizenName: 'Ramesh Patel',
    contactNumber: '+91 92345 67890',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.012, BASE_LAT + 0.012] },
    addressText: 'Shop No. 7, Near Old Post Office, Dharavi Junction',
    emergencyType: 'MEDICAL_CRITICAL',
    severity: 'CRITICAL',
    peopleCount: 1,
    vulnerableDetails: { infants: 0, elderly: 1, injured: 1 },
    notes: 'Severe compound fracture after masonry collapse. Heavy bleeding, conscious but fading.',
    status: 'PENDING',
    offlineCreatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    syncedAt: new Date(),
  },
  {
    clientRequestId: uuidv4(),
    citizenName: 'Kavita Deshmukh',
    contactNumber: '+91 93456 78901',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.018, BASE_LAT - 0.010] },
    addressText: 'Shree Ganesh Co-op Housing Society, Rooftop terrace',
    emergencyType: 'TRAPPED',
    severity: 'HIGH',
    peopleCount: 6,
    vulnerableDetails: { infants: 0, elderly: 1, injured: 0 },
    notes: 'Trapped on terrace with 6 neighbors. Ground floors inundated. No drinking water left.',
    status: 'PENDING',
    offlineCreatedAt: new Date(Date.now() - 1800000), // 30 mins ago
    syncedAt: new Date(),
  },
  {
    clientRequestId: uuidv4(),
    citizenName: 'Anil Verma',
    contactNumber: '+91 94567 89012',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.005, BASE_LAT - 0.009] },
    addressText: 'Plot 42, Industrial Area Gate 3',
    emergencyType: 'FOOD_WATER',
    severity: 'MEDIUM',
    peopleCount: 8,
    vulnerableDetails: { infants: 2, elderly: 0, injured: 0 },
    notes: 'Group of factory workers stranded on high platform. Safe from water but stranded without food.',
    status: 'PENDING',
    offlineCreatedAt: new Date(Date.now() - 900000), // 15 mins ago
    syncedAt: new Date(),
  },
];

export const sampleVolunteers = getSampleVolunteers();
export const sampleIncidents = getSampleIncidents();

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Clearing existing SOS requests and volunteers...');
    await SOSRequest.deleteMany({});
    await Volunteer.deleteMany({});

    console.log('[Seed] Seeding sample rescue volunteer units...');
    const createdVolunteers = await Volunteer.insertMany(getSampleVolunteers());

    console.log('[Seed] Seeding sample disaster SOS incidents...');
    const createdIncidents = await SOSRequest.insertMany(getSampleIncidents());

    console.log(
      `[Seed] Successfully seeded ${createdVolunteers.length} volunteers and ${createdIncidents.length} incidents!`
    );

    return {
      volunteersCount: createdVolunteers.length,
      incidentsCount: createdIncidents.length,
      volunteers: createdVolunteers,
      incidents: createdIncidents,
    };
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

// If executed directly from command line
if (process.argv[1]?.endsWith('seedData.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      console.log('[Seed] Finished successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    }
  })();
}
