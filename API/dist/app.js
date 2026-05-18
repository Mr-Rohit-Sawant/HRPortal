"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const cvRoutes_1 = __importDefault(require("./routes/cvRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);
// Body parsing
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET));
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/cv', cvRoutes_1.default);
app.use('/api/jobs', jobRoutes_1.default);
app.use('/api/employees', employeeRoutes_1.default);
app.use('/api/clients', clientRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), version: process.env.APP_VERSION });
});
// Error handling
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map