import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UploadController } from '@/controllers/uploadController';
import { fileValidation } from '@/utils/validation';
import { moderateLimiter } from '@/middleware/security';
import { AppError } from '@/middleware/errorHandler';

const router = Router();
const uploadController = new UploadController();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enhanced multer configuration for standalone file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Handle Chinese filenames properly and add timestamp
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_');
    cb(null, `${timestamp}-${randomSuffix}-${sanitizedName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: fileValidation.maxSize,
    files: fileValidation.maxFiles,
    fieldSize: 10 * 1024 * 1024, // 10MB for field data
    fields: 10 // Maximum number of non-file fields
  },
  fileFilter: (req, file, cb) => {
    try {
      // Basic validation - detailed validation happens in controller
      fileValidation.validateFile(file);
      cb(null, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File validation error';
      cb(new AppError(message, 400, 'FILE_VALIDATION_ERROR'));
    }
  }
});

// Routes
router.post(
  '/',
  moderateLimiter, // Apply moderate rate limiting to file uploads
  upload.array('files', fileValidation.maxFiles),
  uploadController.uploadFiles
);

router.delete(
  '/:fileId',
  uploadController.deleteFile
);

router.get(
  '/:fileId',
  uploadController.getFileInfo
);

export default router;