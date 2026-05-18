"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = exports.uploadFont = exports.uploadProfilePhoto = exports.uploadLogo = exports.uploadBulkCV = exports.uploadCV = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const errorMiddleware_1 = require("./errorMiddleware");
const ensureDir = (dir) => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
};
const createStorage = (destination) => multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.cwd(), destination);
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const cvFilter = (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext))
        cb(null, true);
    else
        cb(new errorMiddleware_1.AppError(`File type ${ext} not allowed. Only PDF, DOC, DOCX, JPG, PNG accepted.`, 400));
};
const imageFilter = (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext))
        cb(null, true);
    else
        cb(new errorMiddleware_1.AppError('Only image files are allowed', 400));
};
const fontFilter = (_req, file, cb) => {
    const allowed = ['.ttf', '.otf', '.woff', '.woff2'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext))
        cb(null, true);
    else
        cb(new errorMiddleware_1.AppError('Only font files (TTF, OTF, WOFF, WOFF2) are allowed', 400));
};
const maxSizeMB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10') * 1024 * 1024;
exports.uploadCV = (0, multer_1.default)({
    storage: createStorage('uploads/cvs'),
    fileFilter: cvFilter,
    limits: { fileSize: maxSizeMB },
});
exports.uploadBulkCV = (0, multer_1.default)({
    storage: createStorage('uploads/cvs'),
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (['.pdf', '.doc', '.docx'].includes(ext))
            cb(null, true);
        else
            cb(new errorMiddleware_1.AppError(`${file.originalname}: Only PDF or Word documents allowed for bulk import`, 400));
    },
    limits: { fileSize: maxSizeMB, files: 50 },
});
exports.uploadLogo = (0, multer_1.default)({
    storage: createStorage('uploads/logos'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});
exports.uploadProfilePhoto = (0, multer_1.default)({
    storage: createStorage('uploads/profiles'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});
exports.uploadFont = (0, multer_1.default)({
    storage: createStorage('uploads/fonts'),
    fileFilter: fontFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
exports.uploadDocument = (0, multer_1.default)({
    storage: createStorage('uploads/documents'),
    limits: { fileSize: maxSizeMB },
});
//# sourceMappingURL=uploadMiddleware.js.map