import { Router } from "express";
import captchaRoutes from "./captcha";
import feedbackRoutes from "./feedback";
import healthRoutes from "./health";
import legacyRoutes from "./legacy";
import uploadRoutes from "./upload";
import testRoutes from "./test";

const router = Router();

// API v1 routes
router.use("/v1/feedback", feedbackRoutes);
router.use("/v1/captcha", captchaRoutes);
router.use("/v1/health", healthRoutes);
router.use("/v1/upload", uploadRoutes);
router.use("/v1/test", testRoutes);

// Legacy route support (for backward compatibility)
router.use("/captcha", captchaRoutes);
router.use("/submit", legacyRoutes);

export default router;
