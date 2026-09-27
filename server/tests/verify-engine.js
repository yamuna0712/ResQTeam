import { connectDB, disconnectDB } from '../src/config/db.js';
import { SOSRequest } from '../src/models/SOSRequest.js';
import { Volunteer } from '../src/models/Volunteer.js';
import { v4 as uuidv4 } from 'uuid';

async function runVerification() {
  console.log('--- Starting resQteam Engine Verification ---');
  await connectDB();

  try {
    // Clean test collections
    await SOSRequest.deleteMany({});
    await Volunteer.deleteMany({});

    // TEST 1: Register Volunteers with 2dsphere indexed locations
    console.log('\n[TEST 1] Registering Volunteers across geographic coordinates...');
    const volunteers = await Volunteer.insertMany([
      {
        name: 'Nearby Unit Alpha',
        phone: '111-222-3333',
        teamType: 'BOAT_RESCUE',
        location: { type: 'Point', coordinates: [72.8780, 19.0765] }, // ~100m away
        isAvailable: true,
      },
      {
        name: 'Far Unit Beta',
        phone: '444-555-6666',
        teamType: 'AIRLIFT',
        location: { type: 'Point', coordinates: [72.9500, 19.1500] }, // ~11km away
        isAvailable: true,
      },
    ]);
    console.log(`✓ Inserted ${volunteers.length} volunteer units.`);

    // TEST 2: Bulk Ingestion via bulkWrite
    console.log('\n[TEST 2] Testing Bulk Ingestion with MongoDB bulkWrite()...');
    const mockClientId = uuidv4();
    const batchData = [
      {
        clientRequestId: mockClientId,
        citizenName: 'Bulk Ingest Citizen #1',
        location: { type: 'Point', coordinates: [72.8777, 19.0760] },
        emergencyType: 'FLOOD_RISING',
        severity: 'CRITICAL',
        peopleCount: 3,
        offlineCreatedAt: new Date(),
        syncedAt: new Date(),
      },
      {
        clientRequestId: uuidv4(),
        citizenName: 'Bulk Ingest Citizen #2',
        location: { type: 'Point', coordinates: [72.8800, 19.0800] },
        emergencyType: 'TRAPPED',
        severity: 'HIGH',
        peopleCount: 2,
        offlineCreatedAt: new Date(),
        syncedAt: new Date(),
      },
    ];

    const bulkOps = batchData.map((item) => ({
      updateOne: {
        filter: { clientRequestId: item.clientRequestId },
        update: { $setOnInsert: item },
        upsert: true,
      },
    }));

    const bulkResult = await SOSRequest.bulkWrite(bulkOps, { ordered: false });
    console.log(`✓ bulkWrite result: Upserted=${bulkResult.upsertedCount}, Matched=${bulkResult.matchedCount}`);
    if (bulkResult.upsertedCount !== 2) {
      throw new Error(`Expected 2 upserted records, got ${bulkResult.upsertedCount}`);
    }

    // TEST 3: Deduplication Test (Client retries bulk ingestion of same clientRequestId)
    console.log('\n[TEST 3] Testing Idempotency & Deduplication across duplicate syncs...');
    const retryOps = [
      {
        updateOne: {
          filter: { clientRequestId: mockClientId },
          update: { $setOnInsert: batchData[0] },
          upsert: true,
        },
      },
    ];
    const retryResult = await SOSRequest.bulkWrite(retryOps, { ordered: false });
    console.log(`✓ Retry result: Upserted=${retryResult.upsertedCount}, Matched=${retryResult.matchedCount}`);
    if (retryResult.upsertedCount !== 0 || retryResult.matchedCount !== 1) {
      throw new Error('Deduplication failed! Duplicate record was created.');
    }
    const totalCount = await SOSRequest.countDocuments();
    console.log(`✓ Verified total count in DB remains ${totalCount} (Zero duplicates).`);

    // TEST 4: MongoDB 2dsphere $geoNear Geospatial Matching
    console.log('\n[TEST 4] Testing 2dsphere Geospatial $geoNear proximity calculations...');
    const targetIncident = await SOSRequest.findOne({ clientRequestId: mockClientId });
    const [lng, lat] = targetIncident.location.coordinates;

    const matchedResponders = await Volunteer.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          query: { isAvailable: true },
        },
      },
      {
        $project: {
          name: 1,
          distanceMeters: { $round: ['$distanceMeters', 1] },
        },
      },
    ]);

    console.log('✓ Geospatial matches found:');
    matchedResponders.forEach((resp, idx) => {
      console.log(`  ${idx + 1}. ${resp.name} - Distance: ${resp.distanceMeters} meters`);
    });

    if (matchedResponders[0].name !== 'Nearby Unit Alpha') {
      throw new Error('Geospatial calculation failed: closest responder was not ranked first!');
    }
    console.log('✓ Confirmed: Nearest volunteer correctly calculated and ranked #1.');

    console.log('\n🎉 ALL ARCHITECTURAL TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runVerification();
