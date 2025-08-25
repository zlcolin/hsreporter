import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
// 使用相对路径导入
import { UploadService } from '../services/uploadService';
import logger from '../utils/logger';

// Mock file for testing
const createMockFile = (filename: string, content: Buffer, mimetype: string): Express.Multer.File => {
  const tempPath = path.join(__dirname, 'temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Write test file
  fs.writeFileSync(tempPath, content);
  
  return {
    fieldname: 'files',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    size: content.length,
    destination: tempDir,
    filename,
    path: tempPath,
    buffer: content,
    stream: null as any,
  };
};

describe('UploadService', () => {
  // 每个测试前创建临时目录
  beforeEach(() => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  // 每个测试后清理临时文件
  afterEach(() => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('validateFile', () => {
    it('should validate a valid JPEG file', async () => {
      // 创建一个更完整的JPEG文件模拟（包含文件头和一些基本数据）
      const jpegData = Buffer.concat([
        Buffer.from([0xFF, 0xD8]), // SOI标记
        Buffer.from([0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]), // APP0标记和JFIF标识
        Buffer.from([0xFF, 0xDB, 0x00, 0x43, 0x00]), // DQT标记
        Buffer.alloc(64, 0x00), // 量化表数据
        Buffer.from([0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00]), // SOF0标记和图像基本信息
        Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFF, 0xD9]) // SOS标记和EOI标记
      ]);
      const validJpeg = createMockFile('test.jpg', jpegData, 'image/jpeg');

      const validation = await UploadService.validateFile(validJpeg);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should reject a file that is too large', async () => {
      // Test invalid file (too large)
      const largeContent = Buffer.alloc(200 * 1024 * 1024); // 200MB
      const largeFile = createMockFile('large.jpg', largeContent, 'image/jpeg');

      const validation = await UploadService.validateFile(largeFile);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });

  describe('processFile', () => {
    it('should process a valid PNG file', async () => {
      // Create a simple test image (PNG header)
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const testPng = createMockFile('test.png', pngHeader, 'image/png');

      const processed = await UploadService.processFile(testPng);
      expect(processed.originalSize).toBe(testPng.size);
      expect(processed.processedSize).toBeDefined();
      expect(processed.compressionRatio).toBeDefined();
      expect(processed.filename).toBeDefined();
    });
  });
});

// 保留创建模拟文件的工具函数
// Export for potential use in other tests
export { createMockFile };