import { execSync } from 'node:child_process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const resolveBasePath = (input?: string) => {
  const trimmed = input?.trim()

  if (!trimmed) {
    return './'
  }

  if (trimmed === '.' || trimmed === './') {
    return './'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

const getGitCommitHash = () => {
  const commitFromEnv = process.env.GITHUB_SHA ?? process.env.VITE_GIT_COMMIT

  if (commitFromEnv) {
    return commitFromEnv.slice(0, 7)
  }

  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const base = resolveBasePath(env.VITE_BASE_PATH ?? (isProduction ? './' : '/'))

  return {
    base,
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.2.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __GIT_COMMIT__: JSON.stringify(getGitCommitHash()),
      __APP_ENV__: JSON.stringify(mode),
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
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: isProduction ? 'hidden' : true,
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks(id) {
            if (id.includes('node_modules/react-dom')) {
              return 'react-dom'
            }

            if (id.includes('node_modules/react')) {
              return 'react'
            }

            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
