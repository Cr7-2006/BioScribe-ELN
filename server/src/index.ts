import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { dbManager } from './config/db';
import { seedDatabase } from './models/seed';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// High-performance response compression (gzip/brotli)
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'BioScribe ELN API',
    stack: 'MERN (MongoDB, Express, React, Node.js)',
    time: new Date().toISOString(),
    mongoActive: dbManager.isMongo,
    postgresActive: dbManager.isPostgres,
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

async function startServer() {
  try {
    // Initialize Database
    await dbManager.init();
    // Seed initial data if needed
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 BioScribe ELN Server (MERN Stack: MongoDB + Express + React + Node.js) running on http://localhost:${PORT}`);
      console.log(`🍃 Database: ${dbManager.isMongo ? 'MongoDB 7.0 Active (Mongoose ODM)' : 'Resilient Local Data Store (MongoDB Offline Mode)'}`);
      console.log(`🧬 Electronic Laboratory Notebook REST API ready at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Fatal error initializing BioScribe ELN server:', err);
    process.exit(1);
  }
}

startServer();
