# CHANGELOG

## [0.2.0] - 2026-05-23

### 新增
- 新增 `ErrorBoundary` 组件，运行时异常时显示错误提示并提供重启/返回主菜单按钮
- 新增 `BuildInfo` 诊断面板，开发模式显示构建版本、时间、commit hash、FPS；生产环境 Ctrl+Shift+D 切换
- 新增 `scripts/check-build.mjs` 构建产物检查脚本
- 新增 `.github/workflows/deploy.yml` CI/CD 部署工作流，含质量门禁、构建、部署三阶段

### 工程化变更
- Vite 生产构建配置：base 路径设为 `/work02/code_files(2)/`（适配 GitHub Pages 子目录部署）
- source map 策略改为 `hidden`（生成但不公开引用）
- chunk 拆分：React 核心库单独分包（`vendor-react`），其他依赖合并（`vendor-libs`）
- 构建产物大小预警阈值：500KB
- 静态资源输出分类：js/、assets/ 子目录
- 构建时注入 `__BUILD_VERSION__`、`__BUILD_TIME__`、`__GIT_HASH__` 等元数据

### 兼容性说明
- 开发模式 base 仍为 `/`，不受生产 base 配置影响
- 现有游戏逻辑未做任何改动
- `npm run dev` 行为完全不变

---

## [0.1.0] - 初始版本

### 新增
- Canvas Defender 塔防游戏核心逻辑
- 三种颜料类型防御塔（红/蓝/黄）
- 三种绘画风格（铅笔/水彩/油画）
- 10 波敌人递增难度
- 图鉴收集系统

---

## 回滚策略

### 原则
1. **部署失败不覆盖线上版本**：GitHub Actions `deploy-pages` 只在构建和 artifact 验证全部通过后才执行，任何前置步骤失败都不会影响已部署的 Pages
2. **保留最近成功构建 artifact**：GitHub Actions 自动保留每次 workflow run 的 artifact，可通过 Actions 页面下载任意成功构建的 dist 产物
3. **回滚步骤**：
   - 打开仓库 Actions 页面，找到最近一次成功的 deploy workflow
   - 点击 "Re-run all jobs" 即可重新部署同一版本的产物
   - 或下载该 workflow 的 artifact，本地解压验证后手动部署
4. **Git 版本回滚**：如需回滚代码 + 重新部署，执行 `git revert <commit>` 推送到 main 分支即自动触发新部署

### 注意事项
- GitHub Pages 部署有缓存周期（通常 1-2 分钟），回滚后请等待缓存刷新
- Artifact 保留期由 GitHub 默认策略决定（90 天），重要版本建议单独存档