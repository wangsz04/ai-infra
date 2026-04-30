#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const bump = process.argv[2];

if (!bump) {
  console.error('用法: npm run release -- [patch|minor|major|<version>]');
  process.exit(1);
}

const validBumps = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];
const isBumpType = validBumps.includes(bump);
const isExactVersion = /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(bump);

if (!isBumpType && !isExactVersion) {
  console.error(`无效的版本参数: ${bump}`);
  console.error('可用值: patch, minor, major, prepatch, preminor, premajor, prerelease, 或精确版本号如 1.2.3');
  process.exit(1);
}

try {
  execSync('git diff --quiet', { stdio: 'pipe' });
} catch {
  console.error('工作区有未提交的更改，请先 commit 或 stash');
  process.exit(1);
}

try {
  execSync('git diff --cached --quiet', { stdio: 'pipe' });
} catch {
  console.error('暂存区有未提交的更改，请先 commit 或 stash');
  process.exit(1);
}

console.log(`正在创建版本: ${bump}...`);
execSync(`npm version ${bump} -m "chore: release v%s"`, { stdio: 'inherit' });

console.log('正在推送 commit 和 tag...');
execSync('git push --follow-tags', { stdio: 'inherit' });

const version = packageJson.version;
console.log(`\n✓ v${version} 已推送，GitHub workflow 将自动发布`);
