# TypeScript Migration Guide

## Overview

This document describes the migration of the HSReporter backend from JavaScript to TypeScript, including the creation of a modular architecture.

## Migration Summary

### ✅ Completed Tasks

1. **TypeScript Configuration**

   - Added `tsconfig.json` with strict type checking
   - Configured path aliases (`@/*` -> `src/*`)
   - Added `tsc-alias` for runtime path resolution

2. **Project Structure Refactoring**

   - Created modular directory structure:
     ```
     src/
     ├── controllers/     # Request handlers
     ├── services/        # Business logic
     ├── middleware/      # Express middleware
     ├── routes/          # Route definitions
     ├── types/           # TypeScript type definitions
     ├── utils/           # Utility functions
     ├── app.ts           # Express app configuration
     └── server.ts        # Server startup
     ```

3. **Code Migration**

   - Migrated `server.js` functionality to TypeScript architecture
   - Migrated `captcha.js` to `CaptchaService` class with enhanced features
   - Created comprehensive type definitions
   - Implemented proper error handling and logging

4. **Enhanced Features**

   - Added security middleware (Helmet, CORS, rate limiting)
   - Implemented structured logging with Winston
   - Added input validation with Joi
   - Enhanced file upload security and processing
   - Added health check endpoints

5. **Build System**
   - Added TypeScript compilation with `tsc`
   - Configured path alias resolution with `tsc-alias`
   - Added development and production scripts

### 🔄 Backward Compatibility

The migration maintains backward compatibility with the existing frontend:

- **Legacy Routes**:
  - `/api/captcha/*` routes still work
  - `/api/submit` endpoint still accepts the same request format
- **Response Format**:
  - Maintains the same response structure for existing endpoints
  - Enhanced with additional metadata and error handling

### 📁 File Mapping

| Old File     | New Location                     | Status      |
| ------------ | -------------------------------- | ----------- |
| `server.js`  | `src/app.ts` + `src/server.ts`   | ✅ Migrated |
| `captcha.js` | `src/services/captchaService.ts` | ✅ Enhanced |
| N/A          | `src/controllers/`               | ✅ New      |
| N/A          | `src/middleware/`                | ✅ New      |
| N/A          | `src/types/`                     | ✅ New      |

### 🚀 Usage

#### Development

```bash
# TypeScript development with hot reload
npm run dev:watch

# Legacy JavaScript development (fallback)
npm run dev:legacy
```

#### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Legacy production (fallback)
npm run start:legacy
```

#### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 🔧 Configuration

#### Environment Variables

The TypeScript version requires the same environment variables as the legacy version:

- `REDMINE_URL`
- `REDMINE_API_KEY`
- `REDMINE_PROJECT_ID`
- `PORT` (optional, defaults to 3000)
- `NODE_ENV` (optional, defaults to 'development')

#### Additional Configuration

- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `LOG_LEVEL`: Logging level (error, warn, info, debug)

### 🛡️ Security Enhancements

1. **Input Validation**: All inputs validated with Joi schemas
2. **File Security**: Enhanced file type validation and header checking
3. **Rate Limiting**: Configurable rate limits for different endpoints
4. **Security Headers**: Helmet middleware for security headers
5. **CORS**: Properly configured CORS policies

### 📊 Performance Improvements

1. **Caching**: Improved captcha storage and cleanup
2. **File Processing**: Image compression and optimization
3. **Error Handling**: Structured error responses and logging
4. **Memory Management**: Proper cleanup of temporary files

### 🔍 Monitoring

1. **Structured Logging**: Winston logger with JSON format
2. **Health Checks**: `/api/v1/health` endpoint
3. **Request Tracking**: Request ID tracking for debugging
4. **Performance Metrics**: Response time and error rate tracking

### 🚨 Breaking Changes

**None** - The migration is designed to be fully backward compatible.

### 📝 Next Steps

1. **Testing**: Comprehensive testing of all endpoints
2. **Documentation**: API documentation with Swagger/OpenAPI
3. **Monitoring**: Production monitoring and alerting setup
4. **Performance**: Load testing and optimization

### 🐛 Troubleshooting

#### Common Issues

1. **Module Resolution Errors**

   - Ensure `tsc-alias` is run after TypeScript compilation
   - Check that all path aliases are properly configured

2. **Environment Variables**

   - Verify all required environment variables are set
   - Check `.env` file is properly loaded

3. **File Upload Issues**
   - Ensure `uploads` directory exists and is writable
   - Check file size and type restrictions

#### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with TypeScript source maps
npm run dev
```

### 📚 Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js TypeScript Guide](https://expressjs.com/en/guide/typescript.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
