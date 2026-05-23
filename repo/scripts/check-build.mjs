import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')
const MAX_BUNDLE_SIZE_KB = 1024 // 单个 chunk 最大 1MB
const MAX_TOTAL_SIZE_KB = 3072 // 总产物最大 3MB

let hasError = false

function fail(msg: string) {
  console.error(`❌ ${msg}`)
  hasError = true
}

function pass(msg: string) {
  console.log(`✅ ${msg}`)
}

// 1. dist 目录存在
if (!fs.existsSync(DIST)) {
  fail('dist 目录不存在，请先执行 npm run build')
  process.exit(1)
}
pass('dist 目录存在')

// 2. index.html 存在
const indexHtml = path.join(DIST, 'index.html')
if (!fs.existsSync(indexHtml)) {
  fail('dist/index.html 不存在')
} else {
  pass('dist/index.html 存在')

  // 3. 检查错误的绝对路径（以 / 开头但不是 base 路径）
  const htmlContent = fs.readFileSync(indexHtml, 'utf-8')
  const badAbsPaths = htmlContent.match(/(?:src|href)="\/(?!\/)[^"]*"/g)
  if (badAbsPaths && badAbsPaths.length > 0) {
    fail(`index.html 中发现可能的错误绝对路径: ${badAbsPaths.join(', ')}`)
  } else {
    pass('index.html 中无错误绝对路径')
  }

  // 4. 检查 404 风险：引用的资源文件是否存在
  const assetRefs = htmlContent.match(/(?:src|href)="([^"]*\.(js|css))"/g) || []
  for (const ref of assetRefs) {
    const filePath = ref.match(/"(.*?)"/)?.[1]
    if (!filePath) continue
    // 去掉 base 路径前缀
    const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const fullPath = path.join(DIST, relativePath)
    if (!fs.existsSync(fullPath)) {
      fail(`index.html 引用的资源不存在: ${filePath} (404 风险)`)
    }
  }
  pass('index.html 引用的资源文件均存在')
}

// 5. 主要 JS/CSS 产物存在
const jsFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.js') || (fs.existsSync(path.join(DIST, 'assets')) && fs.readdirSync(path.join(DIST, 'assets')).some(a => a.endsWith('.js'))))
const assetsDir = path.join(DIST, 'assets')
let hasJs = false
let hasCss = false

if (fs.existsSync(assetsDir)) {
  const assets = fs.readdirSync(assetsDir)
  hasJs = assets.some(f => f.endsWith('.js'))
  hasCss = assets.some(f => f.endsWith('.css'))
}

if (!hasJs) fail('未找到 JS 产物') else pass('JS 产物存在')
if (!hasCss) fail('未找到 CSS 产物') else pass('CSS 产物存在')

// 6. 产物大小检查
function getDirSize(dir: string): number {
  let total = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) total += getDirSize(full)
    else total += fs.statSync(full).size
  }
  return total
}

function checkFileSizes(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      checkFileSizes(full)
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
      const sizeKb = fs.statSync(full).size / 1024
      if (sizeKb > MAX_BUNDLE_SIZE_KB) {
        fail(`${path.relative(DIST, full)} 大小 ${sizeKb.toFixed(1)}KB 超过阈值 ${MAX_BUNDLE_SIZE_KB}KB`)
      }
    }
  }
}

checkFileSizes(DIST)
pass('单个 chunk 大小检查完成')

const totalSizeKb = getDirSize(DIST) / 1024
if (totalSizeKb > MAX_TOTAL_SIZE_KB) {
  fail(`总产物大小 ${totalSizeKb.toFixed(1)}KB 超过阈值 ${MAX_TOTAL_SIZE_KB}KB`)
} else {
  pass(`总产物大小 ${totalSizeKb.toFixed(1)}KB 在合理范围内`)
}

// 总结
console.log('\n--- 构建产物检查结果 ---')
if (hasError) {
  console.error('❌ 检查未通过，请修复上述问题')
  process.exit(1)
} else {
  console.log('✅ 所有检查通过')
}
