import fs from 'fs';
import path from 'path';
import { UploadService } from '../services/uploadService';

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

// Test file validation
async function testFileValidation() {
  console.log('Testing file validation...');
  
  try {
    // Test valid JPEG file
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const validJpeg = createMockFile('test.jpg', jpegHeader, 'image/jpeg');
    
    const validation = await UploadService.validateFile(validJpeg);
    console.log('JPEG validation result:', validation);
    
    // Test invalid file (too large)
    const largeContent = Buffer.alloc(200 * 1024 * 1024); // 200MB
    const largeFile = createMockFile('large.jpg', largeContent, 'image/jpeg');
    
    const largeValidation = await UploadService.validateFile(largeFile);
    console.log('Large file validation result:', largeValidation);
    
    // Cleanup
    fs.unlinkSync(validJpeg.path);
    fs.unlinkSync(largeFile.path);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Test file processing
async function testFileProcessing() {
  console.log('Testing file processing...');
  
  try {
    // Create a simple test image (PNG header)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const testPng = createMockFile('test.png', pngHeader, 'image/png');
    
    const processed = await UploadService.processFile(testPng);
    console.log('Processing result:', {
      originalSize: processed.originalSize,
      processedSize: processed.processedSize,
      compressionRatio: processed.compressionRatio,
      filename: processed.filename
    });
    
    // Cleanup
    fs.unlinkSync(testPng.path);
    if (processed.processedPath !== processed.originalPath && fs.existsSync(processed.processedPath)) {
      fs.unlinkSync(processed.processedPath);
    }
    
  } catch (error) {
    console.error('Processing test error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('Starting upload service tests...\n');
  
  await testFileValidation();
  console.log('');
  await testFileProcessing();
  
  console.log('\nTests completed!');
  
  // Cleanup temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Export for potential use in other tests
export { createMockFile, testFileValidation, testFileProcessing };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}