import { AppError } from "@/middleware/errorHandler";
import { FeedbackData } from "@/types/feedback";
import logger from "@/utils/logger";
import axios, { AxiosResponse } from "axios";
import fs from "fs";

interface RedmineUploadResponse {
  upload: {
    token: string;
    filename: string;
    filesize: number;
    content_type: string;
  };
}

interface RedmineIssueResponse {
  issue: {
    id: number;
    subject: string;
    description: string;
    status: {
      id: number;
      name: string;
    };
    assigned_to?: {
      id: number;
      name: string;
    };
  };
}

export class RedmineService {
  private static instance: RedmineService;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly projectId: string;

  public static getInstance(): RedmineService {
    if (!RedmineService.instance) {
      RedmineService.instance = new RedmineService();
    }
    return RedmineService.instance;
  }

  private constructor() {
    this.baseUrl = process.env.REDMINE_URL || "";
    this.apiKey = process.env.REDMINE_API_KEY || "";
    this.projectId = process.env.REDMINE_PROJECT_ID || "";

    // In development mode, allow running without Redmine configuration
    if (
      process.env.NODE_ENV !== "development" &&
      (!this.baseUrl || !this.apiKey || !this.projectId)
    ) {
      throw new Error("Redmine configuration is incomplete");
    }

    // Log warning if running in development mode without proper config
    if (
      process.env.NODE_ENV === "development" &&
      (!this.baseUrl || !this.apiKey || !this.projectId)
    ) {
      console.warn(
        "Warning: Running in development mode without complete Redmine configuration. Using mock responses."
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File
  ): Promise<{ token: string; filename: string; content_type: string }> {
    try {
      // In development mode without proper config, return mock response
      if (
        process.env.NODE_ENV === "development" &&
        (!this.baseUrl || !this.apiKey || !this.projectId)
      ) {
        return {
          token: `mock_token_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          filename: file.originalname,
          content_type: file.mimetype,
        };
      }

      const fileData = fs.readFileSync(file.path);
      const encodedFilename = encodeURIComponent(file.originalname);

      const response: AxiosResponse<RedmineUploadResponse> = await axios.post(
        `${this.baseUrl}/uploads.json`,
        fileData,
        {
          headers: {
            "X-Redmine-API-Key": this.apiKey,
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (!response.data?.upload) {
        throw new Error("Invalid response from Redmine upload API");
      }

      logger.info("File uploaded to Redmine", {
        filename: file.originalname,
        token: response.data.upload.token,
        size: response.data.upload.filesize,
      });

      return {
        token: response.data.upload.token,
        filename: file.originalname,
        content_type: file.mimetype,
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error uploading file to Redmine", {
        filename: file.originalname,
        error: message,
      });

      if (error.response) {
        throw new AppError(
          `文件上传到Redmine失败: ${error.response.status} ${error.response.statusText}`,
          503,
          "REDMINE_UPLOAD_ERROR"
        );
      }

      throw new AppError("文件上传到Redmine失败", 503, "REDMINE_UPLOAD_ERROR");
    }
  }

  async createIssue(
    feedbackData: FeedbackData,
    uploadTokens: any[]
  ): Promise<number> {
    try {
      // In development mode without proper config, return mock response
      if (
        process.env.NODE_ENV === "development" &&
        (!this.baseUrl || !this.apiKey || !this.projectId)
      ) {
        const mockIssueId = Math.floor(Math.random() * 10000) + 1000;
        console.log(
          `Mock issue created with ID: ${mockIssueId} for feedback: ${feedbackData.description.substring(
            0,
            50
          )}...`
        );
        return mockIssueId;
      }

      const issueDescription = this.buildIssueDescription(feedbackData);

      const issueData = {
        issue: {
          project_id: parseInt(this.projectId),
          subject: this.buildIssueSubject(feedbackData),
          description: issueDescription,
          tracker_id: this.getTrackerId(feedbackData.type),
          priority_id: this.getPriorityId(feedbackData.type),
          uploads: uploadTokens,
        },
      };

      const response: AxiosResponse<RedmineIssueResponse> = await axios.post(
        `${this.baseUrl}/issues.json`,
        issueData,
        {
          headers: {
            "X-Redmine-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (!response.data?.issue) {
        throw new Error("Invalid response from Redmine issue creation API");
      }

      const issueId = response.data.issue.id;

      logger.info("Issue created in Redmine", {
        issueId,
        subject: response.data.issue.subject,
        feedbackId: feedbackData.id,
      });

      return issueId;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error creating issue in Redmine", {
        feedbackId: feedbackData.id,
        error: message,
      });

      if (error.response) {
        throw new AppError(
          `创建Redmine问题单失败: ${error.response.status} ${error.response.statusText}`,
          503,
          "REDMINE_ISSUE_ERROR"
        );
      }

      throw new AppError("创建Redmine问题单失败", 503, "REDMINE_ISSUE_ERROR");
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${this.projectId}.json`,
        {
          headers: {
            "X-Redmine-API-Key": this.apiKey,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.status === 200;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Redmine connection check failed", { error: message });
      return false;
    }
  }

  private buildIssueDescription(feedbackData: FeedbackData): string {
    let description = `**问题类型:** ${this.getTypeDisplayName(
      feedbackData.type
    )}\n\n`;
    description += `**问题描述:**\n${feedbackData.description}\n\n`;

    if (feedbackData.contact) {
      description += `**联系信息:**\n`;
      if (feedbackData.contact.email) {
        description += `- 邮箱: ${feedbackData.contact.email}\n`;
      }
      if (feedbackData.contact.phone) {
        description += `- 电话: ${feedbackData.contact.phone}\n`;
      }
      if (feedbackData.contact.hsId) {
        description += `- 互生号: ${feedbackData.contact.hsId}\n`;
      }
      description += "\n";
    }

    description += `**提交信息:**\n`;
    description += `- 提交时间: ${feedbackData.metadata.timestamp.toLocaleString(
      "zh-CN"
    )}\n`;
    description += `- 来源: ${feedbackData.metadata.source}\n`;
    if (feedbackData.metadata.userAgent) {
      description += `- 用户代理: ${feedbackData.metadata.userAgent}\n`;
    }

    return description;
  }

  private buildIssueSubject(feedbackData: FeedbackData): string {
    const typeDisplay = this.getTypeDisplayName(feedbackData.type);
    const shortDescription = feedbackData.description.substring(0, 50);
    const suffix = feedbackData.description.length > 50 ? "..." : "";

    return `[${typeDisplay}] 用户反馈 - ${shortDescription}${suffix}`;
  }

  private getTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      bug: "Bug报告",
      complaint: "投诉建议",
      suggestion: "功能建议",
    };
    return typeMap[type] || type;
  }

  private getTrackerId(type: string): number {
    // Default tracker IDs - should be configurable
    const trackerMap: Record<string, number> = {
      bug: 1, // Bug
      complaint: 2, // Feature
      suggestion: 3, // Support
    };
    return trackerMap[type] || 1;
  }

  private getPriorityId(type: string): number {
    // Default priority IDs - should be configurable
    const priorityMap: Record<string, number> = {
      bug: 4, // High
      complaint: 3, // Normal
      suggestion: 2, // Low
    };
    return priorityMap[type] || 3;
  }
}
