# HSReporter - 问题反馈系统

<div align="center">

![HSReporter Logo](https://img.shields.io/badge/HSReporter-问题反馈系统-blue?style=for-the-badge)

[![Vue.js](https://img.shields.io/badge/Vue.js-3.4+-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1+-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.4+-409EFF?style=flat-square&logo=element&logoColor=white)](https://element-plus.org/)
[![Docker](https://img.shields.io/badge/Docker-支持-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

一个现代化的问题反馈系统，支持 Bug 报告、用户吐槽和功能建议，具备完整的响应式设计和移动端优化。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#-技术栈) • [项目结构](#-项目结构) • [API 文档](#-api-文档)

</div>

## 📋 目录

- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [环境配置](#-环境配置)
- [开发指南](#-开发指南)
- [API 文档](#-api-文档)
- [部署说明](#-部署说明)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## ✨ 功能特性

### 🎯 核心功能

- **多类型反馈支持**

  - 🐛 Bug 报告：详细的错误描述和重现步骤
  - 💬 用户吐槽：产品体验和改进建议
  - 💡 功能建议：新功能需求和创意想法

- **智能表单系统**

  - 📝 动态表单验证和实时反馈
  - 📊 表单完成度进度显示
  - 💾 自动草稿保存功能
  - 🔄 智能表单重置和恢复

- **文件上传管理**
  - 📎 支持多种文件格式（图片、视频、文档）
  - 🖼️ 图片预览和压缩优化
  - 📏 文件大小和数量限制
  - 🗂️ 拖拽上传体验

### 🎨 用户体验

- **响应式设计**

  - 📱 完美适配移动端、平板和桌面
  - 🎯 优化的触摸交互体验
  - 📐 自适应布局和组件

- **主题系统**

  - 🌞 浅色主题
  - 🌙 深色主题
  - 🔄 跟随系统主题
  - 🎨 平滑主题切换动画

- **移动端优化**
  - 👆 增强的触摸手势支持
  - ⌨️ 智能键盘处理
  - 📳 触觉反馈支持
  - 🔒 防止意外缩放

### 🔒 安全特性

- **验证码系统**

  - 🖼️ SVG 验证码生成
  - 🔄 自动刷新和验证
  - ⏰ 验证码过期管理

- **数据安全**
  - 🛡️ 请求频率限制
  - 🔐 文件类型验证
  - 🧹 自动清理临时文件
  - 📝 详细的操作日志

### 🚀 性能优化

- **前端优化**

  - ⚡ Vite 构建工具
  - 🎯 组件懒加载
  - 📦 代码分割和压缩
  - 🖼️ 图片懒加载

- **后端优化**
  - 🔄 异步处理
  - 📊 内存优化
  - 🗄️ 文件流处理
  - ⚡ 响应缓存

## 🛠️ 技术栈

### 前端技术

| 技术             | 版本  | 描述                   |
| ---------------- | ----- | ---------------------- |
| **Vue.js**       | 3.4+  | 渐进式 JavaScript 框架 |
| **TypeScript**   | 5.7+  | 类型安全的 JavaScript  |
| **Element Plus** | 2.4+  | Vue 3 组件库           |
| **Pinia**        | 3.0+  | Vue 状态管理           |
| **Vite**         | 6.3+  | 下一代前端构建工具     |
| **Axios**        | 1.11+ | HTTP 客户端            |
| **VueUse**       | 13.6+ | Vue 组合式 API 工具集  |

### 后端技术

| 技术           | 版本  | 描述                  |
| -------------- | ----- | --------------------- |
| **Node.js**    | 18+   | JavaScript 运行时     |
| **Express**    | 5.1+  | Web 应用框架          |
| **TypeScript** | 5.9+  | 类型安全的 JavaScript |
| **Multer**     | 1.4+  | 文件上传中间件        |
| **Sharp**      | 0.34+ | 图片处理库            |
| **Winston**    | 3.17+ | 日志记录              |
| **Joi**        | 18.0+ | 数据验证              |

### 开发工具

- **ESLint** + **Prettier** - 代码规范和格式化
- **Husky** + **Lint-staged** - Git 钩子和代码检查
- **Jest** - 单元测试框架
- **Docker** - 容器化部署

## 🚀 快速开始

### 📋 前置要求

确保你的开发环境已安装：

- **Node.js** 18+
- **npm** 或 **yarn**
- **Git**
- **Docker** (可选，用于容器化部署)

### 🔧 安装步骤

#### 方式一：本地开发环境

```bash
# 1. 克隆项目
git clone <repository-url>
cd hsreporter

# 2. 安装后端依赖
cd backend
npm install

# 3. 安装前端依赖
cd ../frontend
npm install

# 4. 启动后端服务 (终端1)
cd backend
npm run dev

# 5. 启动前端服务 (终端2)
cd frontend
npm run dev
```

#### 方式二：Docker 容器化

```bash
# 1. 克隆项目
git clone <repository-url>
cd hsreporter

# 2. 使用 Docker Compose 启动
docker-compose up --build

# 后台运行
docker-compose up -d --build
```

### 🌐 访问应用

| 服务         | 本地开发              | Docker                |
| ------------ | --------------------- | --------------------- |
| **前端应用** | http://localhost:5173 | http://localhost:8082 |
| **后端 API** | http://localhost:3000 | http://localhost:3000 |

## 📁 项目结构

```
hsreporter/
├── 📁 frontend/                 # 前端应用
│   ├── 📁 src/
│   │   ├── 📁 assets/          # 静态资源
│   │   │   └── 📁 styles/      # 样式文件
│   │   │       ├── variables.css           # CSS 变量
│   │   │       ├── responsive.css         # 响应式样式
│   │   │       └── mobile-enhancements.css # 移动端优化
│   │   ├── 📁 components/      # Vue 组件
│   │   │   ├── 📁 common/      # 通用组件
│   │   │   ├── 📁 form/        # 表单组件
│   │   │   └── 📁 layout/      # 布局组件
│   │   ├── 📁 composables/     # 组合式 API
│   │   ├── 📁 services/        # API 服务
│   │   ├── 📁 stores/          # Pinia 状态管理
│   │   ├── 📁 types/           # TypeScript 类型
│   │   ├── 📁 utils/           # 工具函数
│   │   └── 📁 views/           # 页面组件
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📄 tsconfig.json
├── 📁 backend/                  # 后端应用
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # 控制器
│   │   ├── 📁 middleware/      # 中间件
│   │   ├── 📁 routes/          # 路由
│   │   ├── 📁 services/        # 业务逻辑
│   │   ├── 📁 types/           # TypeScript 类型
│   │   ├── 📁 utils/           # 工具函数
│   │   └── 📄 server.ts        # 服务器入口
│   ├── 📁 uploads/             # 文件上传目录
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   └── 📄 .env                 # 环境配置
├── 📄 docker-compose.yml       # Docker 编排
├── 📄 README.md               # 项目说明
└── 📄 .gitignore              # Git 忽略文件
```

## ⚙️ 环境配置

### 后端环境变量 (`backend/.env`)

```properties
# 服务器配置
PORT=3000
NODE_ENV=development

# Redmine 集成配置
REDMINE_URL=http://task.redmine.com/
REDMINE_API_KEY=your_api_key_here
REDMINE_PROJECT_ID=feedback

# 文件上传配置
MAX_FILE_SIZE=104857600          # 100MB
UPLOAD_DIR=uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/avi,video/mov,application/pdf,text/plain

# 验证码配置
CAPTCHA_EXPIRE_TIME=300000       # 5分钟
CAPTCHA_CLEANUP_INTERVAL=60000   # 1分钟

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 频率限制
RATE_LIMIT_WINDOW_MS=900000      # 15分钟
RATE_LIMIT_MAX_REQUESTS=100      # 最大请求数
```

### 前端环境变量 (`frontend/.env`) - 可选

```properties
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000

# 应用配置
VITE_APP_TITLE=HSReporter
VITE_APP_VERSION=1.0.0
```

## 👨‍💻 开发指南

### 🔧 开发命令

#### 前端开发

```bash
cd frontend

# 开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

#### 后端开发

```bash
cd backend

# 开发服务器 (带热重载)
npm run dev

# 监听模式开发
npm run dev:watch

# 构建项目
npm run build

# 启动生产服务器
npm start

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 📱 移动端开发和测试

我们的应用经过了全面的移动端优化，包括：

#### 响应式设计特性

- **断点系统**：xs(480px), sm(768px), md(1024px), lg(1200px), xl(1440px)
- **触摸优化**：所有交互元素符合 WCAG 2.1 AA 标准（最小 44px）
- **手势支持**：滑动、长按、双击等手势识别
- **键盘处理**：智能键盘弹出和收起处理

#### 主题系统

- **浅色主题**：适合日间使用的明亮界面
- **深色主题**：适合夜间使用的深色界面
- **自动主题**：跟随系统主题设置
- **平滑切换**：主题切换带有过渡动画

#### 性能优化

- **低端设备优化**：自动检测设备性能并调整动画
- **图片懒加载**：提升页面加载速度
- **代码分割**：按需加载减少初始包大小

### 🧪 测试指南

#### 移动端测试

1. **浏览器开发者工具**

   ```bash
   # 启动开发服务器
   npm run dev

   # 打开 Chrome DevTools
   # 切换到设备模拟器
   # 测试不同设备尺寸
   ```

2. **真机测试**

   ```bash
   # 获取本机 IP 地址
   ipconfig  # Windows
   ifconfig  # macOS/Linux
   
   # 使用 IP 地址访问
   # 例如：http://192.168.1.100:5173
   ```

#### 功能测试清单

- [ ] 表单提交和验证
- [ ] 文件上传功能
- [ ] 验证码生成和验证
- [ ] 主题切换功能
- [ ] 响应式布局
- [ ] 触摸交互
- [ ] 键盘弹出处理
- [ ] 错误处理和提示

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **文件上传**: `multipart/form-data`

### 主要接口

#### 1. 提交反馈

```http
POST /api/feedback
Content-Type: multipart/form-data

# 表单字段
type: string              # bug | complaint | suggestion
title: string             # 标题
description: string       # 描述
severity?: string         # 严重程度 (仅 bug)
environment?: string      # 环境信息 (仅 bug)
email?: string           # 邮箱
phone?: string           # 电话
captcha: string          # 验证码
captchaId: string        # 验证码ID
files?: File[]           # 附件文件
```

#### 2. 获取验证码

```http
GET /api/captcha

# 响应
{
  "id": "uuid",
  "svg": "<svg>...</svg>"
}
```

#### 3. 验证验证码

```http
POST /api/captcha/verify
Content-Type: application/json

{
  "id": "uuid",
  "code": "1234"
}

# 响应
{
  "valid": true
}
```

### 错误处理

所有 API 错误响应格式：

```json
{
  "error": "错误类型",
  "message": "错误描述",
  "details": "详细信息"
}
```

常见错误码：

- `400` - 请求参数错误
- `413` - 文件过大
- `429` - 请求过于频繁
- `500` - 服务器内部错误

## 🚀 部署说明

### Docker 部署 (推荐)

```bash
# 1. 构建和启动服务
docker-compose up -d --build

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

### 手动部署

#### 后端部署

```bash
# 1. 构建项目
cd backend
npm run build

# 2. 启动服务
npm start

# 3. 使用 PM2 (推荐)
npm install -g pm2
pm2 start dist/server.js --name hsreporter-backend
```

#### 前端部署

```bash
# 1. 构建项目
cd frontend
npm run build

# 2. 部署到 Web 服务器
# 将 dist/ 目录内容复制到 Web 服务器根目录
```

### 环境变量配置

生产环境需要修改以下配置：

```properties
# backend/.env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com

# 其他安全配置...
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 代码规范

- 遵循 ESLint 和 Prettier 配置
- 编写清晰的提交信息
- 添加必要的测试用例
- 更新相关文档

### 问题报告

使用 GitHub Issues 报告问题时，请包含：

- 问题描述和重现步骤
- 环境信息（浏览器、操作系统等）
- 错误截图或日志
- 预期行为说明

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [Express](https://expressjs.com/) - Node.js Web 框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

<div align="center">

**[⬆ 回到顶部](#hsreporter---问题反馈系统)**

Made with ❤️ by HSReporter Team

</div>
