"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const notFound = (req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
exports.notFound = notFound;
const errorHandler = (err, req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    // Prisma errors
    if (err.code === 'P2002') {
        statusCode = 409;
        // target can be a string ("username"), an array (["username"]), or a constraint name
        const raw = err.meta?.target;
        const field = Array.isArray(raw)
            ? raw.join(', ')
            : typeof raw === 'string'
                ? raw.replace(/^.*_(\w+)_key$/, '$1') // strip Prisma constraint prefix e.g. User_username_key → username
                : 'field';
        const FIELD_LABELS = {
            email: 'Email address',
            username: 'Username',
            phone: 'Phone number',
            employeeId: 'Employee ID',
        };
        message = `${FIELD_LABELS[field] ?? field} is already taken`;
    }
    else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found';
    }
    else if (err.code === 'P2003') {
        statusCode = 400;
        message = 'Invalid reference: related record not found';
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    if (statusCode === 500) {
        logger_1.logger.error({ message: err.message, stack: err.stack, url: req.url, method: req.method });
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorMiddleware.js.map