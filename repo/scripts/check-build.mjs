#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const MAX_SIZE_MB = 5;

console.log('🔍 Checking build artifacts...\n');

let passed = true;

function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.log(`❌ ${message}`);
    passed = false;
  }
}

check(existsSync(DIST_DIR), 'dist directory exists');

const indexHtml = join(DIST_DIR, 'index.html');
check(existsSync(indexHtml), 'index.html exists');

if (existsSync(indexHtml)) {
  const content = readFileSync(indexHtml, 'utf-8');
  check(!content.includes('src="/'), 'No absolute paths in index.html');
  check(content.includes('/work02/'), 'Base path configured correctly');
}

const assetsDir = join(DIST_DIR, 'assets');
check(existsSync(assetsDir), 'assets directory exists');

if (existsSync(assetsDir)) {
  const files = ['js', 'css'].map(ext => {
    const files = require('fs').readdirSync(assetsDir);
    return files.some(f => f.endsWith(`.${ext}`));
  });
  check(files[0], 'JS files exist');
  check(files[1], 'CSS files exist');
}

let totalSize = 0;
function calculateSize(dir) {
  const fs = require('fs');
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      calculateSize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
}

if (existsSync(DIST_DIR)) {
  calculateSize(DIST_DIR);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
  check(parseFloat(sizeMB) <= MAX_SIZE_MB, `Total size (${sizeMB}MB) <= ${MAX_SIZE_MB}MB`);
}

console.log('\n' + (passed ? '🎉 All checks passed!' : '❌ Some checks failed!'));
process.exit(passed ? 0 : 1);
