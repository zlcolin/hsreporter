import Joi from "joi";

export const feedbackSchema = Joi.object({
  type: Joi.string()
    .valid("bug", "complaint", "suggestion")
    .required()
    .messages({
      "any.only": "问题类型必须是 bug、complaint 或 suggestion 之一",
      "any.required": "问题类型是必填项",
    }),
  description: Joi.string().min(10).max(5000).required().messages({
    "string.min": "问题描述至少需要10个字符",
    "string.max": "问题描述不能超过5000个字符",
    "any.required": "问题描述是必填项",
  }),
  contact: Joi.object({
    email: Joi.string().email().optional().messages({
      "string.email": "邮箱格式不正确",
    }),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .optional()
      .messages({
        "string.pattern.base": "手机号格式不正确",
      }),
    hsId: Joi.string()
      .pattern(/^\d{11}$/)
      .optional()
      .messages({
        "string.pattern.base": "互生号必须是11位数字",
      }),
  }).optional(),
  captcha: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.length": "验证码必须是4位数字",
      "string.pattern.base": "验证码必须是4位数字",
      "any.required": "验证码是必填项",
    }),
  captchaId: Joi.string().required().messages({
    "any.required": "验证码ID是必填项",
  }),
});

export const captchaVerifySchema = Joi.object({
  captchaId: Joi.string().required().messages({
    "any.required": "验证码ID是必填项",
  }),
  code: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.length": "验证码必须是4位数字",
      "string.pattern.base": "验证码必须是4位数字",
      "any.required": "验证码是必填项",
    }),
});

export const fileValidation = {
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 3,

  validateFile(file: Express.Multer.File): boolean {
    // Basic validation - detailed validation is handled by UploadService
    if (file.size > this.maxSize) {
      throw new Error("文件大小超出限制");
    }

    return true;
  },
};
