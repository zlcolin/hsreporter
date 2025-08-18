# Frontend TypeScript 设置指南

## 概述

本项目已成功迁移到 TypeScript，并配置了完整的代码质量工具链。

## 已完成的配置

### 1. TypeScript 配置

- ✅ **主入口文件迁移**: `main.js` → `main.ts`
- ✅ **TypeScript 配置文件**:
  - `tsconfig.json` - 项目引用配置
  - `tsconfig.app.json` - 应用程序配置
  - `tsconfig.node.json` - Node.js 工具配置
- ✅ **类型定义文件**:
  - `src/types/env.d.ts` - 环境变量和 Vue 模块类型
  - `src/types/global.d.ts` - 全局类型定义

### 2. 代码质量工具

- ✅ **ESLint 配置**: `eslint.config.js`
  - Vue 3 + TypeScript 支持
  - 严格的类型检查规则
  - 代码风格统一
- ✅ **Prettier 配置**: `.prettierrc`
  - 统一的代码格式化
  - 与 ESLint 集成
- ✅ **Husky + lint-staged**:
  - Git 提交前自动格式化和检查

### 3. VS Code 工作区配置

- ✅ **工作区设置**: `.vscode/settings.json`
  - TypeScript 智能提示优化
  - 自动格式化配置
  - 文件关联设置
- ✅ **推荐扩展**: `.vscode/extensions.json`
  - Vue 3 开发必备扩展
  - TypeScript 支持
  - 代码质量工具
- ✅ **调试配置**: `.vscode/launch.json`
  - Chrome 调试支持
- ✅ **多根工作区**: `hsreporter.code-workspace`
  - 前端、后端分离管理

## 可用的 NPM 脚本

```bash
# 开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint:check

# 代码检查并自动修复
npm run lint

# 代码格式化
npm run format

# 格式化检查
npm run format:check

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## TypeScript 配置特点

### 严格模式

- `strict: true` - 启用所有严格类型检查
- `noUnusedLocals: true` - 检查未使用的局部变量
- `noUnusedParameters: true` - 检查未使用的参数
- `noFallthroughCasesInSwitch: true` - 检查 switch 语句

### 路径映射

```typescript
"paths": {
  "@/*": ["src/*"]
}
```

### 模块解析

- `moduleResolution: "bundler"` - 使用 bundler 模式
- `allowImportingTsExtensions: true` - 允许导入 .ts 扩展名

## ESLint 规则配置

### Vue 规则

- 组件命名采用 PascalCase
- 模板中使用 kebab-case
- 属性使用连字符命名

### TypeScript 规则

- 禁止使用 `any` 类型（警告级别）
- 未使用变量检查
- 显式函数返回类型（关闭）

### 通用规则

- 优先使用 `const`
- 禁止使用 `var`
- 使用模板字符串

## 开发建议

### 1. 类型安全

- 尽量避免使用 `any` 类型
- 为复杂对象定义接口
- 使用类型断言时要谨慎

### 2. 代码组织

- 将类型定义放在 `src/types/` 目录
- 使用 Composables 复用逻辑
- 保持组件的单一职责

### 3. 性能优化

- 使用 `defineAsyncComponent` 进行组件懒加载
- 合理使用 `shallowRef` 和 `shallowReactive`
- 避免在模板中使用复杂计算

## 故障排除

### 类型错误

如果遇到类型错误，可以：

1. 运行 `npm run type-check` 检查具体错误
2. 检查 `src/types/` 目录下的类型定义
3. 确保导入路径正确

### ESLint 错误

如果遇到 ESLint 错误：

1. 运行 `npm run lint` 自动修复
2. 检查 `eslint.config.js` 配置
3. 必要时添加 `// eslint-disable-next-line` 注释

### 构建错误

如果构建失败：

1. 确保所有依赖已安装
2. 检查 TypeScript 配置
3. 运行 `npm run type-check` 验证类型

## 下一步

1. 继续优化现有组件的类型定义
2. 添加更多的类型安全检查
3. 集成单元测试框架
4. 配置 CI/CD 流程
