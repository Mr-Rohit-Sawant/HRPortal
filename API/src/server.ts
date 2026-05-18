import dotenv from 'dotenv';
dotenv.config();

import app, { prisma } from './app';
import { logger } from './utils/logger';
import { initElasticsearch } from './services/searchService';

const PORT = parseInt(process.env.PORT || '5001', 10);

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    await initElasticsearch();

    app.listen(PORT, () => {
      logger.info(`🚀 HR Recruitment API running on http://localhost:${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
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
