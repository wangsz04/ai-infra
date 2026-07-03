#!/usr/bin/env node

import { execSync } from 'child_process';
import pc from 'picocolors';

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

if (currentBranch !== 'main') {
  console.error(pc.red(`错误: 当前分支 ${pc.cyan(currentBranch)} 不是 ${pc.cyan('main')} 分支，请在 GitHub 上创建 PR 到 main，合并后再发布`));
  process.exit(1);
}

console.log(pc.yellow(`当前分支: ${currentBranch}，本地发布脚本已废弃`));
console.log(pc.yellow('请在 GitHub 仓库的 Actions 页面手动触发 release-trigger 工作流进行发布'));
console.log(pc.yellow(`例如: https://github.com/wangsz04/ai-infra/actions/workflows/release-trigger.yml`));
