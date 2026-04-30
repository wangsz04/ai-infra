## 1. 修改 release.js - 分支检测

- [x] 1.1 引入 `picocolors`（`import pc from 'picocolors'`），在参数校验后、工作区检查前，通过 `git rev-parse --abbrev-ref HEAD` 获取当前分支名
- [x] 1.2 main 分支保持现有行为：校验通过后执行 `npm version` → `git push --follow-tags`
- [x] 1.3 非 main 分支输出错误信息 `当前分支 <branch> 不是 main 分支，请在 GitHub 上创建 PR 到 main，合并后再发布`，以非零状态退出
- [x] 1.4 main 分支和非 main 分支均输出当前分支信息

## 2. 验证与测试

- [ ] 2.1 在 main 分支上测试所有 bump 类型均正常执行
- [ ] 2.2 在非 main 分支上测试发布被拒绝，给出正确的引导提示
