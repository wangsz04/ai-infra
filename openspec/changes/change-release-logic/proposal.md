## Why

当前 main 分支已限制为仅能通过 GitHub Pull Request 更新，禁止直接 push。现有的 `npm run release` 本地发布脚本（`scripts/release.js`）在 `npm version` 后执行 `git push --follow-tags` 将因 push 被拒绝而失败。需要在 PR 合并后自动完成版本更新、打 tag 和 npm 发布，同时保留对版本号类型（major/minor/patch/prepatch 等）的自定义选择。

## What Changes

- **废弃** `scripts/release.js` 的本地发布流程（`npm run release`）
- **新增** GitHub Actions 工作流，在 PR 合并到 main 后手动触发版本发布
- **新增** GitHub Actions 工作流支持通过 workflow_dispatch 选择版本 bump 类型：`patch`、`minor`、`major`、`prepatch`、`preminor`、`premajor`、`prerelease`，默认值为 `prepatch`（beta 预发布）
- **强制** 版本必须基于当前 `package.json` 版本号递增，不接受自定义版本号
- **补充** 发布工作流自动更新 `package.json` 版本号、创建对应 git commit 和 git tag 并推送，触发已有的 `publish.yml` 进行 npm publish
- **修改** `scripts/release.js` 改为仅用于本地验证或保留为兼容入口但不再推送
- **修改** 现有 `.github/workflows/publish.yml` 可能需要调整触发方式或集成新流程

## Capabilities

### New Capabilities
- `pr-triggered-release`: PR 合并后手动触发的版本发布工作流，支持选择 bump 类型（patch/minor/major/prepatch/preminor/premajor/prerelease，默认 prepatch），强制基于当前 `package.json` 版本递增，自动更新 `package.json`、创建 git commit + git tag、推送后触发 npm 发布

### Modified Capabilities
- `branch-based-release`: 现有 spec 定义了分支检测规则。当前 `scripts/release.js` 已实现 main 分支发布、非 main 拒绝的逻辑，但 main 分支被保护后该方式不再可行。需要修改为通过 GitHub Actions workflow 代替本地脚本完成版本管理

## Impact

- **废弃**: `scripts/release.js` — 本地发布功能不再可用
- **新增**: `.github/workflows/release-trigger.yml` — 新的 workflow_dispatch 工作流
- **修改**: `.github/workflows/publish.yml` — 触发方式保持 tag push 不变，或与新流程集成
- **配置**: 可能需要添加 GitHub Token 权限以允许 workflow 创建 tag 和推送 commit
- **文档**: 发布流程变更需要在项目贡献文档中更新
