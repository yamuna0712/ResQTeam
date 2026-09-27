import mongoose from 'mongoose';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resqteam';

  try {
    console.log(`[resQteam DB] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to fallback if local mongod not active
    });
    console.log(`[resQteam DB] Connected to external/local MongoDB successfully.`);
  } catch (err) {
    console.warn(`[resQteam DB] External MongoDB connection failed (${err.message}).`);

    if (process.env.USE_MEMORY_DB_FALLBACK !== 'false') {
      try {
        console.log(`[resQteam DB] Launching in-memory MongoDB fallback (mongodb-memory-server)...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServer.getUri();
        await mongoose.connect(memoryUri);
        console.log(`[resQteam DB] Connected to In-Memory MongoDB successfully: ${memoryUri}`);
        console.log(`[resQteam DB] (Note: GeoJSON 2dsphere indexing and bulkWrite are fully supported in-memory!)`);
      } catch (memErr) {
        console.error(`[resQteam DB] In-memory MongoDB failed to start:`, memErr);
        throw memErr;
      }
    } else {
      throw err;
    }
  }

  // Ensure 2dsphere indexes are built
  mongoose.connection.on('error', (err) => {
    console.error(`[resQteam DB] MongoDB runtime error:`, err);
  });
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
