import { CaptchaController } from "@/controllers/captchaController";
import { apiLimiter } from "@/middleware/security";
import { validateRequest } from "@/middleware/validation";
import { captchaVerifySchema } from "@/utils/validation";
import { Router } from "express";

const router = Router();
const captchaController = new CaptchaController();

// Routes
router.get("/generate", apiLimiter, captchaController.generateCaptcha);

router.post(
  "/verify",
  apiLimiter,
  validateRequest(captchaVerifySchema),
  captchaController.verifyCaptcha
);

router.post("/refresh", apiLimiter, captchaController.refreshCaptcha);

export default router;
