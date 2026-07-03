## Context

当前发布流程：`scripts/release.js` 本地执行 → `npm version` 创建 commit + tag → `git push --follow-tags` 推送 → 触发 `.github/workflows/publish.yml` 执行 `npm publish`。`main` 分支已开启分支保护，禁止直接 push，导致本地 `npm run release` 失败。

需要改用 GitHub Actions `workflow_dispatch` 在 PR 合并后在 CI 环境中完成版本发布。

## Goals / Non-Goals

**Goals:**
- 在 PR 合并到 main 后，通过 `workflow_dispatch` 手动触发版本发布
- 支持 7 种 bump 类型：patch/minor/major/prepatch/preminor/premajor/prerelease，默认 prepatch
- 必须基于当前 `package.json` 版本递增，不接受自定义版本号
- 自动更新 `package.json`、创建 git commit + git tag (v*.*.*)、推送触发 npm publish
- 废弃 `scripts/release.js` 的本地发布功能，改为提示用户使用 Actions

**Non-Goals:**
- 不修改 `publish.yml` 的 npm publish 逻辑（保持 tag push 触发不变）
- 不实现自动化版本选择（如根据 commit message 自动识别 bump 类型）
- 不影响开发分支的常规 PR 流程

## Decisions

### Decision 1: 新建 `release-trigger.yml` 独立工作流
新建 `.github/workflows/release-trigger.yml`，通过 `workflow_dispatch` 触发，接收 `bump` 输入参数。与现有 `publish.yml` 职责分离：前者负责版本递增和打 tag，后者负责 npm publish。

**Rationale:** 保持关注点分离。`publish.yml` 已稳定运行，不需要修改。新增的工作流只需关注版本管理和 git 操作。

### Decision 2: 使用 `npm version` 而非手动修改 `package.json`
在 CI 中直接使用 `npm version <bump>` 命令，与当前 `release.js` 行为一致。避免重复实现 semver 递增逻辑。

**Alternatives considered:**
- 手动 `node -e` 修改 `package.json` + `git tag`：需要自行维护 semver 逻辑，容易出错
- 使用 `standard-version` 等第三方工具：引入额外依赖，当前项目无此依赖

**Rationale:** `npm version` 是内置命令，语义明确，自动处理 commit 和 tag 创建，且与本地行为一致。

### Decision 3: 通过 `GITHUB_TOKEN` 推送，需配置分支保护规则
工作流使用内置的 `GITHUB_TOKEN` 并授予 `contents: write` 权限。由于 main 分支受保护，需要在 GitHub 仓库设置中启用 "Allow force pushes" 或允许 "Allow specified actors to bypass" 中的 `GITHUB_TOKEN`。

**Rationale:** `GITHUB_TOKEN` 是 Actions 内置认证方式，无需额外创建 Personal Access Token。但受保护分支默认禁止 workflow 推送，需要调整分支保护规则。

**Push 策略:** 先 `git push origin HEAD:main` 推送 commit，再 `git push origin <tag>` 推送 tag，分步执行以便在推送失败时分步排查。

### Decision 4: 配置 git 身份信息
在 workflow 中显式配置 `git config user.name` 和 `git config user.email`，使用 bot 身份（如 `github-actions[bot]`）。

**Rationale:** `npm version` 创建的 commit 需要 git 用户信息，否则会失败。使用 bot 身份避免与实际开发者的 commit 混淆。

### Decision 5: 废弃 `release.js` 但不删除
修改 `release.js` 使其在 `main` 分支上输出废弃提示并退出（不执行 `npm version` 和 `git push`），在非 `main` 分支上保持原有拒绝逻辑。

**Rationale:** 不直接删除以避免破坏已配置的 CI 脚本引用。提供清晰的迁移指引给使用者。

### Decision 6: 跳过 git hooks
在 workflow 中执行 `npm version` 时设置 `HUSKY=0` 环境变量，避免 commit-msg hook 等本地校验在 CI 中出错。

**Rationale:** 与当前 `release.js` 中的 `HUSKY: '0'` 行为一致。

## Risks / Trade-offs

- **[Risk] 分支保护规则阻止 GITHUB_TOKEN 推送** → 需要在 GitHub 仓库 Settings > Branches 中修改 main 分支规则，允许 "Allow specified actors to bypass" 或勾选 "Allow GitHub Actions to create and approve pull requests"。若无法修改规则，需改用 Personal Access Token 存储在 secrets 中。
- **[Risk] 并发触发导致版本冲突** → 若多个 PR 合并后同时触发 workflow_dispatch，后续触发的流程可能因 tag 冲突而失败。当前接受此风险，因为发布操作是人为串行的。
- **[Risk] npm version 执行时间长** → `npm version` 会触发 `version` 和 `postversion` 脚本。当前 `package.json` 中无此类脚本，风险较低。
- **[Trade-off] 手动触发而非自动** → 用户需要在 PR 合并后在 Actions 页面手动选择 bump 类型并触发。更自动化（如 label 驱动）不在当前目标范围内。

## Open Questions

- 是否需要支持通过 PR label（如 `release:patch`）实现触发而非手动 workflow_dispatch？
- 是否需要在 `publish.yml` 中添加通知（如 Slack/DingTalk）？
