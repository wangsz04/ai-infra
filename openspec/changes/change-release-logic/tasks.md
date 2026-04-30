## 1. 新建 GitHub Actions 发布触发工作流

- [x] 1.1 创建 `.github/workflows/release-trigger.yml`，定义 `workflow_dispatch` 事件，包含 `bump` 输入参数（type: choice，选项: patch/minor/major/prepatch/preminor/premajor/prerelease，默认 prepatch）
- [x] 1.2 工作流配置 `permissions: contents: write` 和 `runs-on: ubuntu-latest`
- [x] 1.3 实现 checkout 代码、setup-node（v22）、`npm ci` 步骤
- [x] 1.4 实现 bump 参数校验步骤，拒绝非预定义值
- [x] 1.5 实现 git 用户身份配置步骤（`git config user.name` 和 `user.email` 使用 github-actions[bot]）
- [x] 1.6 实现 `npm version <bump>` 步骤，设置 `HUSKY: 0` 环境变量跳过 git hooks
- [x] 1.7 实现推送步骤：先 `git push origin HEAD:main` 推送 commit，再 `git push origin <tag>` 推送 tag

## 2. 确认分支保护规则

- [x] 2.1 无需修改：`GITHUB_TOKEN` + `contents: write` 可正常推送 commit 和 tag（若推送失败，需在 Settings > Branches 中启用 "Allow GitHub Actions to create and approve pull requests"）

## 3. 废弃本地发布脚本

- [x] 3.1 修改 `scripts/release.js`：当在 `main` 分支上执行时输出废弃提示并退出（不执行 npm version 和 git push）
- [x] 3.2 确保非 `main` 分支上保持原有拒绝逻辑不变
- [x] 3.3 本地验证 `npm run release -- prepatch` 在 main 分支输出提示后退出

## 4. 验证完整发布流程

- [ ] 4.1 在 GitHub Actions 页面手动触发 release-trigger 工作流，选择 prepatch 并运行
- [ ] 4.2 验证工作流成功更新 `package.json` 版本
- [ ] 4.3 验证工作流成功创建 git tag（格式 `v<version>`）
- [ ] 4.4 验证 tag 成功推送到远程仓库
- [ ] 4.5 验证 `publish.yml` 被 tag push 触发并执行 npm publish
- [ ] 4.6 验证发布到 npm 的包版本与 tag 一致
