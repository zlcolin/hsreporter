import { AppError } from "@/middleware/errorHandler";
import logger from "@/utils/logger";
import { fromBuffer as fileTypeFromBuffer } from "file-type";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: string;
}

export interface ProcessedFile {
  originalPath: string;
  processedPath: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  mimetype: string;
  filename: string;
}

export class UploadService {
  private static readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo", // .avi
    "video/x-ms-wmv", // .wmv
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_FILES = 3;

  // File signature magic numbers for validation
  private static readonly FILE_SIGNATURES = {
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/gif": [0x47, 0x49, 0x46],
    "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
    "video/mp4": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp box
    "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  };

  /**
   * Validate file based on multiple security checks
   */
  static async validateFile(
    file: Express.Multer.File
  ): Promise<FileValidationResult> {
    try {
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: `文件大小超出限制，最大允许 ${
            this.MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        };
      }

      // Check if file exists
      if (!fs.existsSync(file.path)) {
        return {
          isValid: false,
          error: "文件不存在",
        };
      }

      // Read file buffer for header validation
      const buffer = fs.readFileSync(file.path);

      // Detect actual file type from content
      const detectedType = await fileTypeFromBuffer(buffer);

      if (!detectedType) {
        return {
          isValid: false,
          error: "无法识别文件类型",
        };
      }

      // Check if detected type is allowed
      if (!this.ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
        return {
          isValid: false,
          error: `不支持的文件类型: ${detectedType.mime}`,
        };
      }

      // Verify file header matches claimed type
      const headerValid = this.validateFileHeader(buffer, detectedType.mime);
      if (!headerValid) {
        return {
          isValid: false,
          error: "文件头验证失败，可能是伪造的文件类型",
        };
      }

      // Additional security checks for images
      if (detectedType.mime.startsWith("image/")) {
        const imageValid = await this.validateImageFile(buffer);
        if (!imageValid.isValid) {
          return imageValid;
        }
      }

      // Check filename for suspicious patterns
      const filenameValid = this.validateFilename(file.originalname);
      if (!filenameValid.isValid) {
        return filenameValid;
      }

      return {
        isValid: true,
        detectedType: detectedType.mime,
      };
    } catch (error) {
      logger.error("File validation error:", error);
      return {
        isValid: false,
        error: "文件验证过程中发生错误",
      };
    }
  }

  /**
   * Validate file header against known signatures
   */
  private static validateFileHeader(buffer: Buffer, mimeType: string): boolean {
    const signature =
      this.FILE_SIGNATURES[mimeType as keyof typeof this.FILE_SIGNATURES];
    if (!signature) {
      // If we don't have a signature for this type, rely on file-type detection
      return true;
    }

    // Check if buffer starts with expected signature
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Additional validation for image files
   */
  private static async validateImageFile(
    buffer: Buffer
  ): Promise<FileValidationResult> {
    try {
      // Use sharp to validate image integrity
      const metadata = await sharp(buffer).metadata();

      // Check for reasonable image dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width > 10000 || metadata.height > 10000) {
          return {
            isValid: false,
            error: "图片尺寸过大",
          };
        }

        if (metadata.width < 1 || metadata.height < 1) {
          return {
            isValid: false,
            error: "无效的图片尺寸",
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: "图片文件损坏或格式不正确",
      };
    }
  }

  /**
   * Validate filename for security issues
   */
  private static validateFilename(filename: string): FileValidationResult {
    // Check for path traversal attempts
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return {
        isValid: false,
        error: "文件名包含非法字符",
      };
    }

    // Check for suspicious extensions
    const suspiciousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".scr",
      ".pif",
      ".com",
      ".js",
      ".vbs",
      ".jar",
    ];
    const ext = path.extname(filename).toLowerCase();
    if (suspiciousExtensions.includes(ext)) {
      return {
        isValid: false,
        error: "不允许的文件扩展名",
      };
    }

    // Check filename length
    if (filename.length > 255) {
      return {
        isValid: false,
        error: "文件名过长",
      };
    }

    return { isValid: true };
  }

  /**
   * Process and optimize uploaded file
   */
  static async processFile(file: Express.Multer.File): Promise<ProcessedFile> {
    const originalSize = file.size;
    let processedPath = file.path;
    let processedSize = originalSize;

    try {
      // Only process images for compression
      if (file.mimetype.startsWith("image/")) {
        processedPath = await this.compressImage(file);
        processedSize = fs.statSync(processedPath).size;
      }

      const compressionRatio =
        originalSize > 0 ? (originalSize - processedSize) / originalSize : 0;

      return {
        originalPath: file.path,
        processedPath,
        originalSize,
        processedSize,
        compressionRatio,
        mimetype: file.mimetype,
        filename: file.filename,
      };
    } catch (error) {
      logger.error("File processing error:", error);
      throw new AppError("文件处理失败", 500, "FILE_PROCESSING_ERROR");
    }
  }

  /**
   * Compress image files
   */
  private static async compressImage(
    file: Express.Multer.File
  ): Promise<string> {
    const outputPath = file.path.replace(
      path.extname(file.path),
      "_compressed" + path.extname(file.path)
    );

    try {
      const image = sharp(file.path);
      const metadata = await image.metadata();

      let pipeline = image;

      // Resize if image is too large
      if (metadata.width && metadata.width > 2048) {
        pipeline = pipeline.resize(2048, null, {
          withoutEnlargement: true,
          fit: "inside",
        });
      }

      // Apply compression based on format
      switch (file.mimetype) {
        case "image/jpeg":
          pipeline = pipeline.jpeg({
            quality: 85,
            progressive: true,
            mozjpeg: true,
          });
          break;
        case "image/png":
          pipeline = pipeline.png({
            compressionLevel: 8,
            progressive: true,
          });
          break;
        case "image/webp":
          pipeline = pipeline.webp({
            quality: 85,
            effort: 6,
          });
          break;
        default:
          // For other formats, just copy
          return file.path;
      }

      await pipeline.toFile(outputPath);

      // Check if compression actually reduced file size
      const originalSize = fs.statSync(file.path).size;
      const compressedSize = fs.statSync(outputPath).size;

      if (compressedSize >= originalSize) {
        // If compressed file is not smaller, use original
        fs.unlinkSync(outputPath);
        return file.path;
      }

      return outputPath;
    } catch (error) {
      logger.error("Image compression error:", error);
      // If compression fails, return original file
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      return file.path;
    }
  }

  /**
   * Clean up temporary files
   */
  static cleanupFiles(files: string[]): void {
    files.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        logger.error(`Failed to cleanup file ${filePath}:`, error);
      }
    });
  }

  /**
   * Get file info for client
   */
  static getFileInfo(file: Express.Multer.File, processed?: ProcessedFile) {
    return {
      id: path.basename(file.filename, path.extname(file.filename)),
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: processed ? processed.processedSize : file.size,
      originalSize: file.size,
      compressionRatio: processed ? processed.compressionRatio : 0,
      uploadedAt: new Date().toISOString(),
    };
  }
}
