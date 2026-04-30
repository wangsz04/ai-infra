## Why

当前发布脚本 `scripts/release.js` 允许在任何分支上执行版本发布，存在误操作风险——开发者可能在功能分支上意外发布正式版本。需要限制仅 main 分支能执行发布，非 main 分支执行时直接报错退出。

## What Changes

- `scripts/release.js` 增加分支检测逻辑
- main 分支：允许所有发布类型（patch, minor, major, prepatch, preminor, premajor, prerelease），行为不变
- 非 main 分支：报错退出，提示开发者先在 GitHub 上创建 PR 到 main，合并后再从 main 发布

## Capabilities

### New Capabilities
- `branch-based-release`: 根据 Git 分支控制发布权限——main 分支正常发布，非 main 分支拒绝执行并给出引导提示

### Modified Capabilities

## Impact

- `scripts/release.js`：增加分支检测和权限限制逻辑
- 开发者体验：非 main 分支运行 `npm run release` 会立即报错，引导走 PR 流程
