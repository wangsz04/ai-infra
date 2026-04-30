## Context

当前 `scripts/release.js` 未做分支检查。需要在参数校验后、工作区检查前插入分支检测逻辑。

## Goals / Non-Goals

**Goals:**
- main 分支：保持现有行为，支持所有 bump 类型
- 非 main 分支：立即报错退出，引导开发者走 PR 流程

**Non-Goals:**
- 不修改 GitHub Actions 发布工作流
- 不涉及 PR 创建逻辑
- 不修改 npm version 行为

## Decisions

- **分支检测方式**: 使用 `git rev-parse --abbrev-ref HEAD` 获取当前分支名，简单可靠
- **主分支标识**: 硬编码 `main`，后续可扩展为数组
- **插入位置**: 在参数校验之后、工作区检查之前插入分支检测，尽早拒绝非法操作
- **退出码**: 使用 `process.exit(1)` 以非零状态退出
- **输出样式**: 使用 `picocolors` 库着色——`pc.red()` 标记错误，`pc.green()` 标记成功，`pc.cyan()` 标记分支名等信息，`pc.bold()` 标记关键提示。项目中已有此依赖（`package.json`）且其他脚本（`scripts/link-skills/*.mjs`）统一使用 `import pc from 'picocolors'`

## Risks / Trade-offs

- 无显著风险。变更范围小，仅在入口处增加分支守卫
