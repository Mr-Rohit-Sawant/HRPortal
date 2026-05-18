import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const transports: winston.transport[] = [
  new winston.transports.Console({ format: combine(colorize(), simple()) }),
];

// Try to add file transports — skip silently if directory isn't writable
try {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  transports.push(new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }));
  transports.push(new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }));
} catch {
  // File logging not available — console only
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
});
