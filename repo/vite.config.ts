import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitHash = execSync('git rev-parse --short HEAD 2>/dev/null || echo "unknown"').toString().trim()
const buildTime = new Date().toISOString()

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/work02/code_files(2)/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  server: {
    port: 62248,   // 随机端口（由脚本生成）
    strictPort: false,     // 若被占用，Vite 会继续找下一个可用端口
    open: false
  },
  preview: {
    port: 62248,            // 预览端口保持默认，可按需改为随机
    strictPort: false
  }
}))