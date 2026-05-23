import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// Config
const MAX_ASSET_SIZE_KB = 1500; // 1.5MB

console.log('--- Starting Build Artifact Check ---');

// 1. 检查 dist 是否存在
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist directory does not exist.');
  process.exit(1);
}
console.log('✅ dist directory exists.');

// 2. 检查 index.html 是否存在
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Error: index.html does not exist.');
  process.exit(1);
}
console.log('✅ index.html exists.');

// 3. 检查主要 JS/CSS 产物是否存在
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ Error: assets directory does not exist.');
  process.exit(1);
}
const assets = fs.readdirSync(assetsPath);
const hasJS = assets.some(file => file.endsWith('.js'));
const hasCSS = assets.some(file => file.endsWith('.css'));
if (!hasJS || !hasCSS) {
  console.error('❌ Error: Missing main JS or CSS files in assets directory.');
  process.exit(1);
}
console.log('✅ Main JS and CSS files exist.');

// 4. 产物大小是否超过阈值
let hasOversizedFiles = false;
assets.forEach(file => {
  const filePath = path.join(assetsPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;
  if (sizeKB > MAX_ASSET_SIZE_KB) {
    console.error(`❌ Error: Asset ${file} exceeds maximum size limit of ${MAX_ASSET_SIZE_KB}KB (Actual: ${sizeKB.toFixed(2)}KB)`);
    hasOversizedFiles = true;
  }
});
if (hasOversizedFiles) {
  process.exit(1);
}
console.log('✅ Asset sizes are within limits.');

// 5. 是否存在错误的绝对路径 & 404 风险路径
const indexHtmlContent = fs.readFileSync(indexPath, 'utf-8');
// 检查是否有根路径引用的资源 (比如 src="/assets/...")
// 这在部署到子目录时会导致 404
if (/(src|href)="\/(?!work02\/code_files\(2\)\/)/.test(indexHtmlContent)) {
  console.error('❌ Error: Found potential 404 absolute path risk in index.html (path starting with "/" but not base).');
  process.exit(1);
}
console.log('✅ No absolute path risks found in index.html.');

console.log('--- Build Artifact Check Passed Successfully ---');
