import { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";
import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

// 创建自定义错误响应
const createRateLimitResponse = (req: Request): ApiResponse => {
  const requestId = (req.headers["x-request-id"] as string) || "unknown";

  return {
    success: false,
    message: "请求过于频繁，请稍后再试",
    error: {
      code: "RATE_LIMIT_EXCEEDED",
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
};

// 验证码生成限流 - 每分钟最多10次
export const captchaGenerateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次请求
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // 使用IP地址作为限流键
    return req.ip || "unknown";
  },
  handler: (req: Request, res: Response) => {
    logger.warn("Captcha generation rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
    });
    res.status(429).json(createRateLimitResponse(req));
  },
});

// 验证码验证限流 - 每分钟最多20次
export const captchaVerifyLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 最多20次请求
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || "unknown";
  },
  handler: (req: Request, res: Response) => {
    logger.warn("Captcha verification rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
    });
    res.status(429).json(createRateLimitResponse(req));
  },
});

// 通用API限流 - 每分钟最多100次
export const generalApiLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || "unknown";
  },
  handler: (req: Request, res: Response) => {
    logger.warn("General API rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
    });
    res.status(429).json(createRateLimitResponse(req));
  },
});

// 文件上传限流 - 每分钟最多5次
export const uploadLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次请求
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || "unknown";
  },
  handler: (req: Request, res: Response) => {
    logger.warn("Upload rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
    });
    res.status(429).json(createRateLimitResponse(req));
  },
});

// 导出所有限流器
export const rateLimiter = {
  captchaGenerate: captchaGenerateLimit,
  captchaVerify: captchaVerifyLimit,
  generalApi: generalApiLimit,
  upload: uploadLimit,
};
