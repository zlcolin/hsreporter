import { FeedbackController } from "@/controllers/feedbackController";
import { UploadController } from "@/controllers/uploadController";
import { AppError } from "@/middleware/errorHandler";
import { strictLimiter } from "@/middleware/security";
import { validateRequest } from "@/middleware/validation";
import { feedbackSchema, fileValidation } from "@/utils/validation";
import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

const router = Router();
const feedbackController = new FeedbackController();
const uploadController = new UploadController();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Handle Chinese filenames properly
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    cb(null, `${timestamp}-${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: fileValidation.maxSize,
    files: fileValidation.maxFiles,
  },
  fileFilter: async (req, file, cb) => {
    try {
      // Basic validation first
      fileValidation.validateFile(file);
      cb(null, true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "File validation error";
      cb(new AppError(message, 400, "FILE_VALIDATION_ERROR"));
    }
  },
});

// Routes
router.post(
  "/",
  strictLimiter, // Apply strict rate limiting to feedback submission
  upload.array("files", fileValidation.maxFiles),
  validateRequest(feedbackSchema),
  feedbackController.submitFeedback
);

router.get("/:id", feedbackController.getFeedbackStatus);

router.get("/stats", feedbackController.getFeedbackStats);

export default router;
