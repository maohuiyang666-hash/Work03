# Changelog

## 0.2.0 - 2026-05-23
- 版本号：0.2.0
- 日期：2026-05-23
- 新增功能：补充 GitHub Pages 发布工作流、构建产物检查脚本、错误边界页面与运行诊断面板。
- 修复问题：修正生产构建 base 路径、移除错误的 /vite.svg 绝对资源引用，避免 GitHub Pages 白屏与 404。
- 工程化变更：统一 dist 输出目录、启用 hidden source map、增加 vendor chunk 拆分与产物大小预警、支持 code_files(2) 与根目录双模式工作流检测。
- 兼容性说明：默认生产构建使用相对资源路径，兼容 GitHub Pages 仓库站点、artifact 下载预览与普通静态服务器部署。

## 发布与回滚策略
- 保留最近一次成功构建的 downloadable artifact，默认保留 14 天，可作为快速回滚包。
- 只有 main 分支会执行 GitHub Pages 正式部署，release/pages 分支只生成 artifact，不覆盖线上版本。
- 部署前必须通过 npm ci、生产构建与 check-build 产物校验，校验失败时不会上传 Pages artifact。
- GitHub Pages 发布依赖 build artifact 验证结果，deploy-pages 仅在 quality-gate 成功后执行。
- 如线上版本异常，可直接重新部署最近一次成功 artifact，或回退到上一个通过质量门禁的提交再次触发工作流。
