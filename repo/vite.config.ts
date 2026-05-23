import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// 获取 Git 信息用于注入构建元数据
function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    const tag = execSync('git describe --tags --exact-match 2>/dev/null || echo ""').toString().trim()
    return { hash, branch, tag }
  } catch {
    return { hash: 'unknown', branch: 'unknown', tag: '' }
  }
}

const gitInfo = getGitInfo()

// GitHub Pages 部署：repo=work02, 子目录=code_files(2)
// 生产 base: /work02/code_files(2)/
// 开发 base: /
const BASE = process.env.NODE_ENV === 'production' ? '/work02/code_files(2)/' : '/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: BASE,
  define: {
    __BUILD_VERSION__: JSON.stringify(gitInfo.tag || gitInfo.hash),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_HASH__: JSON.stringify(gitInfo.hash),
    __GIT_BRANCH__: JSON.stringify(gitInfo.branch),
    __BUILD_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    port: 62248,
    strictPort: false,
    open: false,
  },
  preview: {
    port: 62248,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: 'hidden', // 生成 source map 但不在产物中引用，用于错误追踪
    chunkSizeWarningLimit: 500, // 构建产物大小预警阈值 (KB)
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心库单独拆包
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          // 其他 node_modules 依赖
          if (id.includes('node_modules')) {
            return 'vendor-libs'
          }
        },
        // 静态资源分类输出
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
  },
})