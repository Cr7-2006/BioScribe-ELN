import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { dbManager } from './config/db';
import { seedDatabase } from './models/seed';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 5000;

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
    time: new Date().toISOString(),
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
      console.log(`🚀 BioScribe ELN Server running on http://localhost:${PORT}`);
      console.log(`🧬 Electronic Laboratory Notebook REST API ready at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Fatal error initializing BioScribe ELN server:', err);
    process.exit(1);
  }
}

startServer();
