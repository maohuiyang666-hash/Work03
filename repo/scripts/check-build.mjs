import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')

const MAX_JS_SIZE_KB = 500
const MAX_CSS_SIZE_KB = 100
const MAX_TOTAL_SIZE_MB = 5

let errors = 0

function fail(msg) {
  console.error(`  FAIL: ${msg}`)
  errors++
}

function pass(msg) {
  console.log(`  PASS: ${msg}`)
}

function fileSizeKB(filepath) {
  return Math.round((fs.statSync(filepath).size / 1024) * 100) / 100
}

function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      walkDir(full, results)
    } else {
      results.push(full)
    }
  }
  return results
}

console.log('\n=== Build Artifact Check ===\n')

// 1. dist 目录存在
if (!fs.existsSync(DIST)) {
  fail('dist 目录不存在')
  process.exit(1)
}
pass('dist 目录存在')

// 2. index.html 存在
const indexHtml = path.join(DIST, 'index.html')
if (!fs.existsSync(indexHtml)) {
  fail('index.html 不存在')
} else {
  pass('index.html 存在')

  const html = fs.readFileSync(indexHtml, 'utf-8')

  // 检查是否存在错误的绝对路径（以 / 开头但不是 /work02/ 的路径）
  const resourcePaths = html.match(/(?:src|href)="([^"]+)"/g) || []
  for (const p of resourcePaths) {
    const match = p.match(/="([^"]+)"/)
    if (match) {
      const url = match[1]
      if (url.startsWith('/') && !url.startsWith('/work02/')) {
        fail(`index.html 中存在可疑绝对路径: ${url}（可能导致 404）`)
      }
    }
  }
  if (resourcePaths.length > 0) {
    pass('index.html 资源路径格式检查完成')
  }
}

// 3. 检查 JS 产物
const jsDir = path.join(DIST, 'js')
if (!fs.existsSync(jsDir)) {
  fail('js 产物目录不存在')
} else {
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'))
  if (jsFiles.length === 0) {
    fail('没有 JS 产物文件')
  } else {
    pass(`js 产物: ${jsFiles.length} 个文件`)
    for (const f of jsFiles) {
      const fp = path.join(jsDir, f)
      const size = fileSizeKB(fp)
      if (size > MAX_JS_SIZE_KB) {
        fail(`JS 文件 ${f} 大小 ${size}KB 超过阈值 ${MAX_JS_SIZE_KB}KB`)
      }
    }
  }
}

// 4. 检查 CSS 产物
const cssDir = path.join(DIST, 'assets')
if (!fs.existsSync(cssDir)) {
  fail('assets 产物目录不存在')
} else {
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))
  if (cssFiles.length === 0) {
    fail('没有 CSS 产物文件')
  } else {
    pass(`CSS 产物: ${cssFiles.length} 个文件`)
    for (const f of cssFiles) {
      const fp = path.join(cssDir, f)
      const size = fileSizeKB(fp)
      if (size > MAX_CSS_SIZE_KB) {
        fail(`CSS 文件 ${f} 大小 ${size}KB 超过阈值 ${MAX_CSS_SIZE_KB}KB`)
      }
    }
  }
}

// 5. 总产物大小
const allFiles = walkDir(DIST)
const totalSizeMB = allFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0) / (1024 * 1024)
if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
  fail(`总产物大小 ${totalSizeMB.toFixed(2)}MB 超过阈值 ${MAX_TOTAL_SIZE_MB}MB`)
} else {
  pass(`总产物大小: ${totalSizeMB.toFixed(2)}MB`)
}

// 6. 检查所有静态资源路径中是否按 BASE 开头
for (const f of allFiles) {
  const rel = path.relative(DIST, f)
  if (!rel.startsWith('js/') && !rel.startsWith('assets/') && !rel.startsWith('index.html') && !rel.endsWith('.map')) {
    fail(`检测到非标准路径的产物: ${rel}（可能存在 404 风险）`)
  }
}

console.log(`\n=== 检查完成: ${errors === 0 ? '全部通过' : `${errors} 个问题`} ===\n`)

if (errors > 0) {
  process.exit(1)
}