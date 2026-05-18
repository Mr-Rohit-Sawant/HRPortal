"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const { combine, timestamp, errors, json, colorize, simple } = winston_1.default.format;
const transports = [
    new winston_1.default.transports.Console({ format: combine(colorize(), simple()) }),
];
// Try to add file transports — skip silently if directory isn't writable
try {
    const logsDir = path_1.default.join(process.cwd(), 'logs');
    if (!fs_1.default.existsSync(logsDir))
        fs_1.default.mkdirSync(logsDir, { recursive: true });
    transports.push(new winston_1.default.transports.File({ filename: path_1.default.join(logsDir, 'error.log'), level: 'error' }));
    transports.push(new winston_1.default.transports.File({ filename: path_1.default.join(logsDir, 'combined.log') }));
}
catch {
    // File logging not available — console only
}
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports,
});
//# sourceMappingURL=logger.js.map