# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-05-23

### 工程化变更
- 修正 Vite 生产构建配置：base 路径支持 GitHub Pages 部署
- 配置 source map 策略（生产环境 hidden，开发环境 inline）
- 配置 chunk 拆分（vendor-react 独立 chunk）
- 设置构建产物大小预警（单 chunk 800KB，总量 3MB）
- 新增 `npm run build:prod` 命令用于 GitHub Pages 生产构建
- 新增 `npm run check-build` 构建产物检查脚本
- 新增 GitHub Actions 部署工作流（`.github/workflows/deploy.yml`）
- 新增 ErrorBoundary 组件，防止运行时异常导致白屏
- 新增开发模式运行诊断信息（版本、构建时间、Git commit、FPS）
- 新增 CHANGELOG.md 版本化发布记录

### 兼容性说明
- 本地开发不受影响，`npm run dev` 行为不变
- `npm run build` 仍以 `/` 为 base 路径，适用于本地预览
- GitHub Pages 部署使用 `npm run build:prod`，base 为 `/work02/code_files(2)/`
- 部署失败不会覆盖线上版本（GitHub Pages 原子部署 + CI 门禁）
- 保留最近一次成功构建 artifact 用于回滚

### 回滚策略
1. GitHub Actions 每次构建保留 dist artifact（保留 30 天）
2. 部署失败时 CI 不通过，不会触发 Pages 部署，线上版本不受影响
3. 回滚方式：在 GitHub Actions 中重新运行上一次成功的工作流，或手动下载 artifact 部署
4. GitHub Pages 部署前必须通过 build artifact 验证（check-build 脚本）
