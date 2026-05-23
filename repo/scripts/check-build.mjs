import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(process.cwd(), process.env.DIST_DIR ?? 'dist')
const expectedBasePath = normalizeBasePath(process.env.EXPECTED_BASE_PATH ?? './')
const maxJsAssetKb = Number(process.env.MAX_JS_ASSET_KB ?? 512)
const maxCssAssetKb = Number(process.env.MAX_CSS_ASSET_KB ?? 256)
const errors = []

function normalizeBasePath(value) {
  const trimmed = value.trim()

  if (trimmed === '.' || trimmed === './') {
    return './'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function fail(message) {
  errors.push(message)
}

function walkFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return walkFiles(absolutePath)
    }

    return absolutePath
  })
}

function isSkippableReference(reference) {
  return /^(data:|https?:|mailto:|tel:|javascript:|#)/.test(reference)
}

function resolveReference(reference) {
  const cleanReference = reference.split(/[?#]/)[0]

  if (!cleanReference) {
    return null
  }

  if (cleanReference.startsWith('/')) {
    if (expectedBasePath === './') {
      fail(`发现错误的绝对路径引用: ${reference}`)
      return null
    }

    if (!cleanReference.startsWith(expectedBasePath)) {
      fail(`绝对路径未匹配预期 base ${expectedBasePath}: ${reference}`)
      return null
    }

    return cleanReference.slice(expectedBasePath.length)
  }

  return cleanReference.replace(/^\.\//, '')
}

function collectReferences(content) {
  const references = []
  const patterns = [
    /(?:src|href)=['"]([^'"]+)['"]/g,
    /url\((['"]?)([^)'"\s]+)\1\)/g,
    /import\((['"])([^'"]+)\1\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      references.push(match[2] ?? match[1])
    }
  }

  return references
}

function validateReferences(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const relativeFilePath = path.relative(distDir, filePath)
  const riskyMarkers = ['/src/', '/public/', '/repo/', '/code_files(2)/', '/vite.svg']

  for (const marker of riskyMarkers) {
    if (content.includes(marker)) {
      fail(`${relativeFilePath} 包含潜在 404 风险路径: ${marker}`)
    }
  }

  for (const reference of collectReferences(content)) {
    if (!reference || isSkippableReference(reference)) {
      continue
    }

    const resolvedReference = resolveReference(reference)

    if (!resolvedReference) {
      continue
    }

    const targetPath = path.join(distDir, resolvedReference)

    if (!fs.existsSync(targetPath)) {
      fail(`${relativeFilePath} 引用了不存在的产物: ${reference}`)
    }
  }
}

function validateAssetSize(files, limitKb, label) {
  for (const filePath of files) {
    const sizeKb = fs.statSync(filePath).size / 1024

    if (sizeKb > limitKb) {
      fail(`${label} 产物超出阈值 ${limitKb}KB: ${path.relative(distDir, filePath)} (${sizeKb.toFixed(2)}KB)`)
    }
  }
}

if (!fs.existsSync(distDir)) {
  fail(`dist 目录不存在: ${distDir}`)
}

if (errors.length === 0) {
  const indexHtmlPath = path.join(distDir, 'index.html')

  if (!fs.existsSync(indexHtmlPath)) {
    fail('dist/index.html 不存在')
  }

  const allFiles = walkFiles(distDir)
  const jsFiles = allFiles.filter((filePath) => filePath.endsWith('.js'))
  const cssFiles = allFiles.filter((filePath) => filePath.endsWith('.css'))
  const textFiles = allFiles.filter((filePath) => /\.(html|js|css)$/.test(filePath))

  if (jsFiles.length === 0) {
    fail('dist 中未找到主要 JS 产物')
  }

  if (cssFiles.length === 0) {
    fail('dist 中未找到主要 CSS 产物')
  }

  validateAssetSize(jsFiles, maxJsAssetKb, 'JS')
  validateAssetSize(cssFiles, maxCssAssetKb, 'CSS')

  for (const filePath of textFiles) {
    validateReferences(filePath)
  }

  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8')
  if (!indexContent.includes('<script type="module"')) {
    fail('dist/index.html 缺少模块脚本入口')
  }
}

if (errors.length > 0) {
  console.error('构建产物检查失败:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('构建产物检查通过')
console.log(`- 目录: ${distDir}`)
console.log(`- 预期 base: ${expectedBasePath}`)
console.log(`- JS 阈值: ${maxJsAssetKb}KB`)
console.log(`- CSS 阈值: ${maxCssAssetKb}KB`)
