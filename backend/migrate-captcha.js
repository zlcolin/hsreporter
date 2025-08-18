/**
 * Migration script to update server.js to use the new TypeScript captcha system
 * This script will be run to integrate the improved captcha system
 */

const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, 'server.js');

// Read the current server.js
let serverContent = fs.readFileSync(serverJsPath, 'utf8');

// Replace the old captcha import
serverContent = serverContent.replace(
  /const { router: captchaRouter, captchaStore } = require\('\.\/captcha'\);/,
  `// Old captcha system replaced with TypeScript version
// const { router: captchaRouter, captchaStore } = require('./captcha');

// Import the new TypeScript captcha system (when compiled)
// const { captchaRoutes } = require('./dist/routes/captchaRoutes');
// const { CaptchaService } = require('./dist/services/captchaService');

// For now, keep the old system for compatibility
const { router: captchaRouter, captchaStore } = require('./captcha');`
);

// Replace the old captcha route
serverContent = serverContent.replace(
  /app\.use\('\/api\/captcha', captchaRouter\);/,
  `// Use the improved captcha routes
app.use('/api/captcha', captchaRouter);
// TODO: Replace with: app.use('/api/v1/captcha', captchaRoutes);`
);

// Update the verifyCaptcha function to use the new service
const newVerifyCaptchaFunction = `
// Enhanced captcha verification function
const verifyCaptcha = async (captchaId, captcha) => {
  try {
    // Use the old system for now, but with improved error handling
    const captchaData = captchaStore.get(captchaId);
    if (!captchaData) {
      console.warn('Captcha verification failed: captcha not found', { captchaId });
      return false;
    }
    
    const now = Date.now();
    if (now - captchaData.timestamp > 5 * 60 * 1000) { // 5分钟过期
      captchaStore.delete(captchaId);
      console.warn('Captcha verification failed: captcha expired', { captchaId });
      return false;
    }
    
    const isValid = captcha === captchaData.code;
    
    if (isValid) {
      captchaStore.delete(captchaId);
      console.info('Captcha verification successful', { captchaId });
    } else {
      console.warn('Captcha verification failed: invalid code', { captchaId });
    }
    
    return isValid;
  } catch (error) {
    console.error('Captcha verification error:', error);
    return false;
  }
};`;

// Replace the old verifyCaptcha function
serverContent = serverContent.replace(
  /\/\/ 模拟验证码验证函数，实际使用时需根据 captchaRouter 实现修改[\s\S]*?return isValid;\s*}/,
  newVerifyCaptchaFunction
);

// Write the updated content back to server.js
fs.writeFileSync(serverJsPath, serverContent, 'utf8');

console.log('✅ Server.js has been updated with improved captcha integration');
console.log('📝 Next steps:');
console.log('   1. Compile TypeScript files: npm run build');
console.log('   2. Update imports to use compiled TypeScript modules');
console.log('   3. Test the new captcha system');
console.log('   4. Remove the old captcha.js file when ready');