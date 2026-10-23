import express from 'express';
import cors from 'cors';
import path from 'path';
import { clock } from './lib/clock';
import { errorHandler } from './middleware/errorHandler';
import { UPLOADS_DIR } from './middleware/upload';
import { authRoutes } from './modules/auth/routes';

export function createApp(): express.Application {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'miniledger-backend',
      timestamp: clock.now().toISOString(),
      today: clock.todayString(),
    });
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
