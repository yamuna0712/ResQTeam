import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import sosRoutes from './routes/sosRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import { seedDatabase } from './config/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client development and production
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// High-capacity JSON parser to handle large bulk store-and-forward sync batches
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'resQteam Disaster Coordination API',
    timestamp: new Date().toISOString(),
    architecture: {
      syncProtocol: 'Store-and-Forward (Bulk Ingestion via MongoDB bulkWrite)',
      geospatialIndex: 'MongoDB 2dsphere GeoJSON Point',
    },
  });
});

// API Routes
app.use('/api/sos', sosRoutes);
app.use('/api/volunteers', volunteerRoutes);

// Instant Seed Endpoint for live demoing and UI onboarding
app.post('/api/seed', async (req, res) => {
  try {
    const result = await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Disaster scenario simulation data seeded successfully!',
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Initialize DB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚨 resQteam API running on http://localhost:${PORT}`);
      console.log(`📡 Bulk Ingestion: POST http://localhost:${PORT}/api/sos/bulk-sync`);
      console.log(`🗺️ Geospatial Engine: GET http://localhost:${PORT}/api/sos/:id/nearest-responders`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize resQteam server:', err);
    process.exit(1);
  }
};

startServer();

export default app;
