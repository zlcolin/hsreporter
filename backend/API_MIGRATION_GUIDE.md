# API Migration Guide

## Overview

This document describes the migration from the legacy API structure to the new RESTful API with TypeScript, validation, and proper error handling.

## Key Changes

### 1. RESTful API Structure

**Old Endpoint:**
```
POST /api/submit
```

**New Endpoints:**
```
POST /api/v1/feedback          # Submit feedback (replaces /api/submit)
GET  /api/v1/feedback/:id      # Get feedback status
GET  /api/v1/feedback/stats    # Get feedback statistics
GET  /api/v1/captcha/generate  # Generate captcha
POST /api/v1/captcha/verify    # Verify captcha
GET  /api/v1/health           # Health check
```

### 2. Unified Response Format

All API responses now follow a consistent format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

**Success Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "feedback-123",
    "issueId": 456,
    "status": "processing",
    "submittedAt": "2025-01-14T10:30:00.000Z"
  },
  "message": "反馈提交成功",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "requestId": "req-abc123"
}
```

**Error Response Example:**
```json
{
  "success": false,
  "message": "输入数据验证失败",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "description",
        "message": "问题描述至少需要10个字符"
      }
    ]
  },
  "timestamp": "2025-01-14T10:30:00.000Z",
  "requestId": "req-abc123"
}
```

### 3. Input Validation

All endpoints now use Joi validation middleware:

**Feedback Submission Schema:**
```typescript
{
  type: 'bug' | 'complaint' | 'suggestion',  // Required
  description: string (10-5000 chars),       // Required
  contact: {                                 // Optional
    email?: string (valid email),
    phone?: string (11 digits),
    hsId?: string (11 digits)
  },
  captcha: string (4 digits),                // Required
  captchaId: string                          // Required
}
```

### 4. Error Handling

Comprehensive error handling with proper HTTP status codes:

- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error (server errors)
- `503` - Service Unavailable (external service errors)

### 5. Security Enhancements

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Sanitization**: XSS protection
- **File Validation**: Secure file uploads

## Migration Steps

### For Frontend Applications

1. **Update API Base URL:**
   ```javascript
   // Old
   const API_BASE = '/api';
   
   // New
   const API_BASE = '/api/v1';
   ```

2. **Update Feedback Submission:**
   ```javascript
   // Old
   const response = await fetch('/api/submit', {
     method: 'POST',
     body: formData
   });
   
   // New
   const response = await fetch('/api/v1/feedback', {
     method: 'POST',
     body: formData
   });
   
   const result = await response.json();
   if (result.success) {
     console.log('Success:', result.data);
   } else {
     console.error('Error:', result.error);
   }
   ```

3. **Update Captcha Handling:**
   ```javascript
   // Old
   const captcha = await fetch('/api/captcha/generate');
   
   // New
   const response = await fetch('/api/v1/captcha/generate');
   const result = await response.json();
   if (result.success) {
     const { imageUrl, captchaId } = result.data;
   }
   ```

4. **Handle New Response Format:**
   ```javascript
   // Always check result.success first
   if (result.success) {
     // Handle success case
     const data = result.data;
   } else {
     // Handle error case
     const errorMessage = result.message;
     const errorCode = result.error?.code;
   }
   ```

### For Backend Integration

1. **Environment Variables:**
   Ensure all required environment variables are set:
   ```env
   REDMINE_URL=https://your-redmine-instance.com
   REDMINE_API_KEY=your-api-key
   REDMINE_PROJECT_ID=your-project-id
   ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
   LOG_LEVEL=info
   NODE_ENV=production
   ```

2. **Start the New Server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## Backward Compatibility

The legacy `/api/submit` endpoint is **deprecated** but still functional through the old `server.js` file. However, it's recommended to migrate to the new API as soon as possible.

To use the legacy API temporarily:
```bash
npm run start:legacy  # Uses old server.js
npm run dev:legacy    # Uses old server.js with nodemon
```

## Testing

1. **Health Check:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Generate Captcha:**
   ```bash
   curl http://localhost:3000/api/v1/captcha/generate
   ```

3. **Submit Feedback:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/feedback \
     -H "Content-Type: application/json" \
     -d '{
       "type": "bug",
       "description": "This is a test bug report",
       "captcha": "1234",
       "captchaId": "test-captcha-id"
     }'
   ```

## Monitoring and Logging

- **Logs Location:** `backend/logs/`
- **Log Files:**
  - `combined.log` - All log entries
  - `error.log` - Error log entries only
- **Health Check:** `GET /api/v1/health`
- **Request Tracking:** Each request gets a unique `requestId`

## Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `CAPTCHA_INVALID` | Captcha verification failed | 400 |
| `FILE_VALIDATION_ERROR` | File upload validation failed | 400 |
| `FILE_UPLOAD_ERROR` | File upload processing error | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `REDMINE_UPLOAD_ERROR` | Redmine file upload failed | 503 |
| `REDMINE_ISSUE_ERROR` | Redmine issue creation failed | 503 |
| `CONNECTION_ERROR` | External service connection failed | 503 |
| `TIMEOUT_ERROR` | Request timeout | 504 |
| `INTERNAL_ERROR` | Server internal error | 500 |
| `NOT_FOUND` | Resource not found | 404 |
| `NOT_IMPLEMENTED` | Feature not implemented | 501 |

## Performance Considerations

- **Rate Limiting:** 100 requests per 15 minutes per IP
- **File Upload:** Max 100MB per file, 3 files max
- **Request Timeout:** 30 seconds for external API calls
- **Memory Usage:** Monitored via health check endpoint

## Next Steps

1. Update frontend applications to use new API endpoints
2. Test all functionality thoroughly
3. Monitor logs for any issues
4. Remove legacy API once migration is complete
5. Consider implementing database storage for feedback tracking