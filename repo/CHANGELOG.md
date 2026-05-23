# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-05-23

### Added (新增功能)
- Initial release of the game `Canvas Defender`.
- Error boundary mechanism to handle runtime errors gracefully without white screens.
- Production diagnostics system providing runtime build information (hidden in production UI).

### Fixed (修复问题)
- Addressed potential pathing issues in production builds by configuring Vite `base`.

### Engineering (工程化变更)
- Implemented production-ready Vite configuration including vendor chunk splitting and source maps.
- Configured GitHub Actions CI/CD workflow (`deploy.yml`) for automated building and deployment to GitHub Pages.
- Created `check-build.mjs` script to automatically verify the integrity of build artifacts (dist size, asset existence, 404 risk paths) before deployment.

### Compatibility (兼容性说明)
- Fully compatible with modern browsers supporting ES modules.
- Mobile browsers are supported but gameplay is optimized for desktop viewports.
