import dotenv from 'dotenv';
dotenv.config();

import app, { prisma } from './app';
import { logger } from './utils/logger';
import { initElasticsearch } from './services/searchService';

const PORT = parseInt(process.env.PORT || '5001', 10);

let dbError: string | null = null;

// Expose DB status on health endpoint
import { Request, Response } from 'express';
app.get('/api/debug', (_req: Request, res: Response) => {
  res.json({
    status: dbError ? 'error' : 'ok',
    dbError,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DB_SET: !!process.env.DATABASE_URL,
      DB_URL_PREVIEW: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':****@'),
    },
  });
});

async function startServer() {
  // Always start listening — even if DB fails we can see debug info
  const server = app.listen(PORT, () => {
    logger.info(`🚀 HR Recruitment API running on port ${PORT}`);
    logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
  });

  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
    await initElasticsearch();
  } catch (error: any) {
    dbError = error?.message || String(error);
    logger.error('❌ Database connection failed:', error);
    // Don't exit — keep server alive so /api/debug shows the error
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

startServer();
