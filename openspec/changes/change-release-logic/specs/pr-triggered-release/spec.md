## ADDED Requirements

### Requirement: workflow_dispatch 版本发布工作流
SHALL 提供一个 GitHub Actions 工作流，通过 `workflow_dispatch` 事件手动触发，运行在 `main` 分支上，用于 PR 合并后执行版本发布。

#### Scenario: 手动触发成功
- **WHEN** 用户在 GitHub Actions 页面选择 `main` 分支
- **WHEN** 选择 bump 类型并点击 "Run workflow"
- **THEN** 工作流 SHALL 启动并执行版本发布流程

### Requirement: bump 类型输入参数
工作流 SHALL 提供 `workflow_dispatch` 的 `inputs.bump` 参数，允许用户选择版本 bump 类型。可选值包括：`patch`、`minor`、`major`、`prepatch`、`preminor`、`premajor`、`prerelease`。默认值为 `prepatch`。

#### Scenario: 支持所有 bump 类型
- **WHEN** 用户选择 `patch` 作为 bump 类型
- **THEN** 版本号 SHALL 按 patch 递增（如 0.0.1 → 0.0.2）
- **WHEN** 用户选择 `minor` 作为 bump 类型
- **THEN** 版本号 SHALL 按 minor 递增（如 0.0.1 → 0.1.0）
- **WHEN** 用户选择 `major` 作为 bump 类型
- **THEN** 版本号 SHALL 按 major 递增（如 0.0.1 → 1.0.0）
- **WHEN** 用户选择 `prepatch` 作为 bump 类型
- **THEN** 版本号 SHALL 按 prepatch 递增（如 0.0.1 → 0.0.2-0）
- **WHEN** 用户选择 `preminor` 作为 bump 类型
- **THEN** 版本号 SHALL 按 preminor 递增（如 0.0.1 → 0.1.0-0）
- **WHEN** 用户选择 `premajor` 作为 bump 类型
- **THEN** 版本号 SHALL 按 premajor 递增（如 0.0.1 → 1.0.0-0）
- **WHEN** 用户选择 `prerelease` 作为 bump 类型
- **THEN** 版本号 SHALL 按 prerelease 递增（如 0.0.1-0 → 0.0.1-1）

#### Scenario: 默认值为 prepatch
- **WHEN** 用户打开 workflow_dispatch 触发界面
- **THEN** bump 输入框的默认值 SHALL 为 `prepatch`

#### Scenario: 无效 bump 类型拒绝
- **WHEN** 用户输入非法的 bump 值（如 `invalid`）
- **THEN** 工作流 SHALL 报错并退出
- **THEN** 工作流 SHALL NOT 修改 `package.json` 或创建 tag

### Requirement: 基于当前 package.json 版本递增
版本号 SHALL 始终基于当前 `package.json` 中的 `version` 字段进行递增，不接受自定义版本号输入。

#### Scenario: 读取当前版本
- **WHEN** 工作流启动
- **THEN** 工作流 SHALL 读取 `package.json` 中的 `version` 字段作为基准版本
- **THEN** 工作流 SHALL 使用 `npm version <bump>` 命令基于该版本递增

#### Scenario: 拒绝自定义版本号
- **WHEN** 用户尝试传入任意自定义版本号（如 `1.2.3`）
- **THEN** 工作流 SHALL 拒绝执行
- **THEN** 工作流 SHALL 提示仅允许使用预定义的 bump 类型

### Requirement: 更新 package.json 版本号并创建 git tag
工作流 SHALL 执行 `npm version <bump>` 命令，自动更新 `package.json` 版本号、创建对应的 git commit 和 git tag（格式 `v<version>`）。

#### Scenario: npm version 执行
- **WHEN** 工作流执行 `npm version prepatch`
- **THEN** `package.json` 的 `version` 字段 SHALL 更新为递增后的版本号
- **THEN** 工作流 SHALL 创建一个 git commit，消息格式为 `chore: release v<version>`
- **THEN** 工作流 SHALL 创建一个 git tag，格式为 `v<version>`

#### Scenario: tag 已存在时处理
- **WHEN** 即将创建的 git tag 已存在
- **THEN** 工作流 SHALL 报错并退出
- **THEN** 工作流 SHALL NOT 覆盖已有 tag

### Requirement: 推送 commit 和 tag
工作流 SHALL 将创建的 git commit 和 git tag 推送到远程仓库。

#### Scenario: 推送成功
- **WHEN** commit 和 tag 创建完成
- **THEN** 工作流 SHALL 执行 `git push` 推送 commit 到 `main`
- **THEN** 工作流 SHALL 执行 `git push origin <tag>` 推送 tag
- **THEN** 推送 SHALL 触发 `.github/workflows/publish.yml` 中的 tag push 事件
- **THEN** `publish.yml` SHALL 执行 npm publish

#### Scenario: 推送失败处理
- **WHEN** `git push` 失败（如网络错误或权限不足）
- **THEN** 工作流 SHALL 输出错误信息
- **THEN** 工作流 SHALL 以非零状态码退出

### Requirement: GitHub Token 权限
工作流 SHALL 使用 `GITHUB_TOKEN` 并授予 `contents: write` 权限以允许推送 commit 和 tag 到 `main` 分支。

#### Scenario: 权限配置
- **WHEN** 工作流定义中包含 `permissions`
- **THEN** SHALL 设置 `contents: write`
- **THEN** SHALL 确保 `GITHUB_TOKEN` 有权限推送到受保护的 `main` 分支（通过 GitHub 分支规则允许 workflow token 推送）
