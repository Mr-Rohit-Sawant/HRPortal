"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
dotenv_1.default.config(); // fallback to .env if env-specific file missing
const app_1 = __importStar(require("./app"));
const logger_1 = require("./utils/logger");
const searchService_1 = require("./services/searchService");
const PORT = parseInt(process.env.PORT || '5001', 10);
let dbError = null;
app_1.default.get('/api/debug', (_req, res) => {
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
    const server = app_1.default.listen(PORT, () => {
        logger_1.logger.info(`🚀 HR Recruitment API running on port ${PORT}`);
        logger_1.logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
    });
    try {
        await app_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        await (0, searchService_1.initElasticsearch)();
    }
    catch (error) {
        dbError = error?.message || String(error);
        logger_1.logger.error('❌ Database connection failed:', error);
        // Don't exit — keep server alive so /api/debug shows the error
    }
}
async function shutdown(signal) {
    logger_1.logger.info(`${signal} received, shutting down gracefully`);
    await app_1.prisma.$disconnect();
    process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled rejection:', reason);
});
startServer();
//# sourceMappingURL=server.js.map