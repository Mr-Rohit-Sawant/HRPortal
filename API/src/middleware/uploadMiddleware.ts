import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from './errorMiddleware';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createStorage = (destination: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), destination);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });

const cvFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError(`File type ${ext} not allowed. Only PDF, DOC, DOCX, JPG, PNG accepted.`, 400));
};

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError('Only image files are allowed', 400));
};

const fontFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.ttf', '.otf', '.woff', '.woff2'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError('Only font files (TTF, OTF, WOFF, WOFF2) are allowed', 400));
};

const maxSizeMB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10') * 1024 * 1024;

export const uploadCV = multer({
  storage: createStorage('uploads/cvs'),
  fileFilter: cvFilter,
  limits: { fileSize: maxSizeMB },
});

export const uploadBulkCV = multer({
  storage: createStorage('uploads/cvs'),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx'].includes(ext)) cb(null, true);
    else cb(new AppError(`${file.originalname}: Only PDF or Word documents allowed for bulk import`, 400));
  },
  limits: { fileSize: maxSizeMB, files: 50 },
});

export const uploadLogo = multer({
  storage: createStorage('uploads/logos'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const uploadFavicon = multer({
  storage: createStorage('uploads/favicons'),
  fileFilter: (_req, file, cb) => {
    const allowed = ['.ico', '.png', '.svg', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new AppError('Only ICO, PNG, SVG or GIF files allowed for favicon', 400));
  },
  limits: { fileSize: 1 * 1024 * 1024 },
});

export const uploadProfilePhoto = multer({
  storage: createStorage('uploads/profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const uploadFont = multer({
  storage: createStorage('uploads/fonts'),
  fileFilter: fontFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadDocument = multer({
  storage: createStorage('uploads/documents'),
  limits: { fileSize: maxSizeMB },
});

const customFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.xlsx', '.xls', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError(`File type ${ext} not supported.`, 400));
};

export const uploadCustomFiles = multer({
  storage: createStorage('uploads/custom'),
  fileFilter: customFileFilter,
  limits: { fileSize: maxSizeMB, files: 20 },
});

const bugReportFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError('Only image or video files are allowed', 400));
};

export const uploadBugReport = multer({
  storage: createStorage('uploads/bug-reports'),
  fileFilter: bugReportFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

// Employee profile photo + optional CV file in one request
const employeeMultiStorage = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      const dest = file.fieldname === 'cvFile'
        ? path.join(process.cwd(), 'uploads/employee-cvs')
        : path.join(process.cwd(), 'uploads/profiles');
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'cvFile') {
      const allowed = ['.pdf', '.doc', '.docx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new AppError('Only PDF or Word documents allowed for CV', 400));
    } else {
      imageFilter(_req, file, cb);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadEmployeeFiles = employeeMultiStorage.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'cvFile', maxCount: 1 },
]);
