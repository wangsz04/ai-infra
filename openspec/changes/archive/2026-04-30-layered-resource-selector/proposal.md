## Why

当前 `@clack/prompts` multiselect 将所有 skill 和 rule 放在一个扁平列表中，仅用分段标题区分。随着资源目录增长，这种扁平方式缺乏可导航性。用户需要分层向导：先选 Agent 适配方案，再按类型→类别→具体资源逐层筛选——符合"我要给 opencode 和 codex 配置 agent 类别的 skill"的自然思维模式，而非滚动一个冗长的无差别列表。

## What Changes

- 在 `src/ui/select.js` 中用多层分步选择向导替换单一扁平 `multiselect`，使用 `@clack/prompts`
- **前置层** — Agent 选择：用户多选目标 Agent 适配方案（OpenCode、Codex、Claude Code、Copilot CLI、Cursor），从 `AGENTS` 常量中展示全部可用预设
- **第一层** — 类型选择：用户多选资源类型（skill、rule）
- **第二层** — 类别选择：对每个被选中的类型，展示其下存在的类别供多选（如 skill 下：agent、git、fe）
- **第三层** — 资源选择：用户多选匹配 type + category 的具体资源
- 多选 Agent 时，对每个选中的 Agent 目录依次注入相同资源
- 保留所有现有行为：`--yes` 自动全选，`--dry-run` 预览，冲突检测 `(exists)` 提示，Esc 取消
- 当通过 `--agent` 显式指定单个 Agent 时，跳过 Agent 选择层，直接进入资源分层选择
- 当无 `--agent` 且当前目录仅检测到一个 Agent 时，仍展示全量 Agent 选择层（而非自动选中）

## Capabilities

### New Capabilities
- `agent-selection`: 在资源选择前展示所有可用 Agent 预设列表，支持多选，支持对多个 Agent 目录批量注入资源
- `layered-selection-wizard`: 多步资源选择流程（类型 → 类别 → 资源），使用 `@clack/prompts` 每层多选，逐步过滤
- `resource-filtering`: 基于前层选择的动态过滤，确保用户只看到相关选项

### Modified Capabilities
<!-- 无现有 spec 定义了 CLI 注入流程的选择行为 -->

## Impact

- `src/ui/select.js` — 核心重写交互选择逻辑
- `src/cli/index.js` — 调整主流程以支持多 Agent 循环注入
- `src/agents/detect.js` — 删除自动检测逻辑模块（仅被 index.js 引用，无其他依赖方）
- `src/ui/` — 可能需要新增层步骤辅助模块
- 无依赖变化 — 继续使用 `@clack/prompts` 和 `picocolors`
- 无 `RESOURCES` 常量变化
