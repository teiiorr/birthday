/**
 * Minimal HTTP server exposing a single health-check endpoint.
 *
 *   GET /health  ->  { "status": "ok", "uptime": <seconds> }
 *
 * Used by Docker / orchestration healthchecks. It deliberately does nothing
 * else and never touches the database on the hot path.
 */
import http from 'http';
import express, { type Express } from 'express';
import { config } from '../../config';
import { createLogger } from '../logger/logger';

const log = createLogger('health');

export class HealthServer {
  private readonly app: Express;
  private server?: http.Server;

  constructor() {
    this.app = express();
    this.app.disable('x-powered-by');

    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get('/', (_req, res) => {
      res.status(200).json({ service: 'birthday-team-bot', status: 'ok' });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);
      this.server.once('error', reject);
      this.server.listen(config.port, () => {
        log.info({ port: config.port }, 'Health-check server listening');
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) return resolve();
      this.server.close(() => resolve());
    });
  }
}
