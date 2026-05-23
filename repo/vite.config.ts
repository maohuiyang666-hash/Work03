import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages'
  // GitHub Pages: repo=work02, subdir=code_files(2)
  // 访问路径: https://<user>.github.io/work02/code_files(2)/
  const base = isGitHubPages ? '/work02/code_files(2)/' : '/'

  return {
    plugins: [react()],
    base,
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
      sourcemap: command === 'build' ? 'hidden' : true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __GIT_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})