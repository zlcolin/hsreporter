import { FeedbackController } from "@/controllers/feedbackController";
import { UploadController } from "@/controllers/uploadController";
import { AppError } from "@/middleware/errorHandler";
import { strictLimiter } from "@/middleware/security";
import { validateRequest } from "@/middleware/validation";
import { feedbackSchema, fileValidation } from "@/utils/validation";
import { Router, Request, Response } from "express";
import { ApiResponse } from "@/types/api";
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

// 确保静态路由在动态路由之前
router.get("/stats", feedbackController.getFeedbackStats);

// 新的测试路由
router.get("/test-stats", async (req: Request, res: Response) => {
    try {
      console.log('测试路由被调用');
      const mockData = [
        { type: 'bug', status: 'pending', count: 5 },
        { type: 'feature', status: 'approved', count: 2 }
      ];
      
      console.log('mockData:', mockData);
      
      const response: ApiResponse = {
        success: true,
        data: mockData,
        message: '测试数据获取成功',
        timestamp: new Date().toISOString(),
        requestId: (req.headers as any)['x-request-id'] || 'unknown'
      };
      
      console.log('发送测试响应:', response);
      res.json(response);
    } catch (error) {
      console.error('测试路由出错:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '服务器内部错误',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        timestamp: new Date().toISOString(),
        requestId: (req.headers as any)['x-request-id'] || 'unknown'
      });
    }
  });

router.get("/:id", feedbackController.getFeedbackStatus);

// 删除重复的测试路由定义

export default router;
