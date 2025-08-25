import { PrismaClient } from '@prisma/client';

// 实例化 PrismaClient
const prisma = new PrismaClient();

// 导出单例
export default prisma;