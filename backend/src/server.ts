import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│                  MiniLedger Backend API                    │
│                                                            │
│  Status:   RUNNING                                         │
│  Host:     http://${env.HOST}:${env.PORT}                         │
│  Env:      ${env.NODE_ENV.padEnd(48)}│
│  Health:   http://localhost:${env.PORT}/health                   │
└────────────────────────────────────────────────────────────┘
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
