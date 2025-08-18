import svgCaptcha from "svg-captcha";
import { logger } from "../utils/logger";

interface CaptchaData {
  code: string;
  timestamp: number;
  attempts: number;
  ip?: string;
}

interface CaptchaResult {
  imageUrl: string;
  captchaId: string;
  expiresIn: number;
}

interface VerificationResult {
  success: boolean;
  message: string;
  reason?: string;
}

interface CaptchaStats {
  totalActive: number;
  totalGenerated: number;
  totalVerified: number;
  totalExpired: number;
  totalFailed: number;
}

export class CaptchaService {
  private static instance: CaptchaService;
  private captchaStore = new Map<string, CaptchaData>();
  private cleanupInterval!: NodeJS.Timeout;
  private stats: CaptchaStats = {
    totalActive: 0,
    totalGenerated: 0,
    totalVerified: 0,
    totalExpired: 0,
    totalFailed: 0,
  };

  public static getInstance(): CaptchaService {
    if (!CaptchaService.instance) {
      CaptchaService.instance = new CaptchaService();
    }
    return CaptchaService.instance;
  }

  // 配置选项
  private readonly config = {
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: true, // 验证码字符颜色
    background: "#f8f9fa", // 背景颜色
    width: 120,
    height: 40,
    fontSize: 36,
    charPreset: "0123456789", // 只使用数字
    expireTime: 5 * 60 * 1000, // 5分钟过期
    maxAttempts: 3, // 最大尝试次数
    cleanupInterval: 60 * 1000, // 每分钟清理一次
  };

  constructor() {
    this.startCleanupTimer();
    logger.info("CaptchaService initialized", {
      expireTime: this.config.expireTime,
      cleanupInterval: this.config.cleanupInterval,
    });
  }

  /**
   * 生成验证码
   */
  async generateCaptcha(ip?: string): Promise<CaptchaResult> {
    try {
      // 生成SVG验证码
      const captcha = svgCaptcha.create({
        size: this.config.size,
        noise: this.config.noise,
        color: this.config.color,
        background: this.config.background,
        width: this.config.width,
        height: this.config.height,
        fontSize: this.config.fontSize,
        charPreset: this.config.charPreset,
      });

      // 生成唯一ID
      const captchaId = this.generateId();
      const timestamp = Date.now();

      // 存储验证码数据
      this.captchaStore.set(captchaId, {
        code: captcha.text,
        timestamp,
        attempts: 0,
        ip,
      });

      // 更新统计
      this.stats.totalGenerated++;
      this.stats.totalActive = this.captchaStore.size;

      // 转换SVG为base64
      const imageUrl = `data:image/svg+xml;base64,${Buffer.from(
        captcha.data
      ).toString("base64")}`;

      logger.debug("Captcha generated", {
        captchaId,
        code: captcha.text, // 在生产环境中应该移除
        ip,
      });

      return {
        imageUrl,
        captchaId,
        expiresIn: this.config.expireTime,
      };
    } catch (error) {
      logger.error("Failed to generate captcha", {
        error: error instanceof Error ? error.message : "Unknown error",
        ip,
      });
      throw new Error("验证码生成失败");
    }
  }

  /**
   * 验证验证码
   */
  async verifyCaptcha(
    captchaId: string,
    inputCode: string
  ): Promise<VerificationResult> {
    try {
      const captchaData = this.captchaStore.get(captchaId);

      // 检查验证码是否存在
      if (!captchaData) {
        this.stats.totalFailed++;
        return {
          success: false,
          message: "验证码不存在或已过期，请重新获取",
          reason: "CAPTCHA_NOT_FOUND",
        };
      }

      // 检查是否过期
      const now = Date.now();
      if (now - captchaData.timestamp > this.config.expireTime) {
        this.captchaStore.delete(captchaId);
        this.stats.totalExpired++;
        this.stats.totalActive = this.captchaStore.size;

        return {
          success: false,
          message: "验证码已过期，请重新获取",
          reason: "CAPTCHA_EXPIRED",
        };
      }

      // 检查尝试次数
      if (captchaData.attempts >= this.config.maxAttempts) {
        this.captchaStore.delete(captchaId);
        this.stats.totalFailed++;
        this.stats.totalActive = this.captchaStore.size;

        return {
          success: false,
          message: "验证码尝试次数过多，请重新获取",
          reason: "TOO_MANY_ATTEMPTS",
        };
      }

      // 增加尝试次数
      captchaData.attempts++;

      // 验证码码值比较（不区分大小写）
      const isValid =
        inputCode.toLowerCase() === captchaData.code.toLowerCase();

      if (isValid) {
        // 验证成功，删除验证码
        this.captchaStore.delete(captchaId);
        this.stats.totalVerified++;
        this.stats.totalActive = this.captchaStore.size;

        logger.info("Captcha verification successful", {
          captchaId,
          attempts: captchaData.attempts,
        });

        return {
          success: true,
          message: "验证码验证成功",
        };
      } else {
        // 验证失败，更新尝试次数
        this.captchaStore.set(captchaId, captchaData);

        const remainingAttempts =
          this.config.maxAttempts - captchaData.attempts;

        logger.warn("Captcha verification failed", {
          captchaId,
          attempts: captchaData.attempts,
          remainingAttempts,
        });

        if (remainingAttempts <= 0) {
          this.captchaStore.delete(captchaId);
          this.stats.totalFailed++;
          this.stats.totalActive = this.captchaStore.size;

          return {
            success: false,
            message: "验证码错误次数过多，请重新获取",
            reason: "TOO_MANY_FAILED_ATTEMPTS",
          };
        }

        return {
          success: false,
          message: `验证码错误，还可尝试 ${remainingAttempts} 次`,
          reason: "INVALID_CODE",
        };
      }
    } catch (error) {
      logger.error("Captcha verification error", {
        error: error instanceof Error ? error.message : "Unknown error",
        captchaId,
      });

      this.stats.totalFailed++;
      throw new Error("验证码验证过程中发生错误");
    }
  }

  /**
   * 使验证码失效
   */
  async invalidateCaptcha(captchaId: string): Promise<boolean> {
    const existed = this.captchaStore.has(captchaId);
    if (existed) {
      this.captchaStore.delete(captchaId);
      this.stats.totalActive = this.captchaStore.size;

      logger.debug("Captcha invalidated", { captchaId });
    }
    return existed;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<CaptchaStats> {
    return {
      ...this.stats,
      totalActive: this.captchaStore.size,
    };
  }

  /**
   * 清理过期的验证码
   */
  private cleanExpiredCaptchas(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [captchaId, data] of this.captchaStore) {
      if (now - data.timestamp > this.config.expireTime) {
        this.captchaStore.delete(captchaId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.stats.totalExpired += expiredCount;
      this.stats.totalActive = this.captchaStore.size;

      logger.debug("Expired captchas cleaned", {
        expiredCount,
        remainingCount: this.captchaStore.size,
      });
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredCaptchas();
    }, this.config.cleanupInterval);

    logger.info("Captcha cleanup timer started", {
      interval: this.config.cleanupInterval,
    });
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      logger.info("Captcha cleanup timer stopped");
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁服务（清理资源）
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.captchaStore.clear();
    logger.info("CaptchaService destroyed");
  }
}
