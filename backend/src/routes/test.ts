import { Router, Request, Response } from "express";
import { ApiResponse } from "@/types/api";

const router = Router();

// 全新的测试路由
router.get("/stats", async (req: Request, res: Response) => {
  try {
    console.log('全新测试路由被调用');
    const mockData = [
      { type: 'bug', count: 15 },
      { type: 'feature', count: 8 }
    ];

    const response: ApiResponse = {
      success: true,
      data: mockData,
      message: '全新测试数据获取成功',
      timestamp: new Date().toISOString(),
      requestId: (req.headers as any)['x-request-id'] || 'unknown'
    };

    console.log('发送全新测试响应:', response);
    res.json(response);
  } catch (error) {
    console.error('全新测试路由出错:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误'
      },
      message: '全新测试路由失败',
      timestamp: new Date().toISOString(),
      requestId: (req.headers as any)['x-request-id'] || 'unknown'
    });
  }
});

export default router;