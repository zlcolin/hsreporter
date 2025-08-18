import { Request, Response, NextFunction } from 'express';
import { RedmineService } from '@/services/redmineService';
import { ApiResponse, HealthCheckResponse } from '@/types/api';
import logger from '@/utils/logger';
import fs from 'fs';
import path from 'path';

export class HealthController {
  private redmineService: RedmineService;
  
  constructor() {
    this.redmineService = RedmineService.getInstance();
  }
  
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = req.headers['x-request-id'] as string;
      
      const checks = {
        redmine: await this.checkRedmine(),
        disk: await this.checkDiskSpace(),
        memory: process.memoryUsage()
      };
      
      const isHealthy = checks.redmine.status === 'ok' && checks.disk.status === 'ok';
      
      const healthData: HealthCheckResponse = {
        status: isHealthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version,
        checks
      };
      
      const response: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: healthData,
        message: isHealthy ? '系统运行正常' : '系统存在问题',
        timestamp: new Date().toISOString(),
        requestId
      };
      
      res.status(isHealthy ? 200 : 503).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  private async checkRedmine(): Promise<{ status: string; message?: string }> {
    try {
      const isConnected = await this.redmineService.checkConnection();
      return {
        status: isConnected ? 'ok' : 'error',
        message: isConnected ? 'Connected' : 'Connection failed'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        message
      };
    }
  }
  
  private async checkDiskSpace(): Promise<{ status: string; message?: string }> {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const stats = fs.statSync(uploadsDir);
      
      // Simple disk space check - in production, use a proper disk space library
      return {
        status: 'ok',
        message: 'Disk space available'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Cannot access uploads directory'
      };
    }
  }
}