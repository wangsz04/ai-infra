## ADDED Requirements

### Requirement: 全量 Agent 预设展示
当用户未通过 `--agent` 参数指定目标 Agent 时，系统 SHALL 展示 `AGENTS` 常量中定义的全部 Agent 预设，而非仅展示当前目录中检测到的 Agent。

#### Scenario: 展示全部预设
- **WHEN** 无 `--agent` 参数
- **THEN** 系统 SHALL 提取 `AGENTS` 中所有条目，展示其 label 和 desc
- **THEN** 系统 SHALL NOT 仅限展示当前 cwd 中已存在目录的 Agent

#### Scenario: --agent 显式指定
- **WHEN** 用户传递 `--agent opencode`
- **THEN** 系统 SHALL 跳过 Agent 选择交互，直接使用该 Agent 进入资源选择

### Requirement: Agent 多选
系统 SHALL 支持用户在 Agent 选择层多选 Agent，使用 @clack/prompts 的 multiselect 实现。

#### Scenario: 多选 Agent
- **WHEN** Agent 选择层展示
- **THEN** 用户 SHALL 可使用空格键切换选中，回车确认
- **THEN** 选中项将被记录并用于后续批量注入

#### Scenario: 至少选一个 Agent
- **WHEN** 用户在 Agent 层未选中任何 Agent 即确认
- **THEN** 系统 SHALL 提示至少选择一个 Agent，或退出

### Requirement: 多 Agent 批量注入
当用户选中多个 Agent 后，系统 SHALL 对每个选中的 Agent 的 targetDir 依次执行相同的资源拷贝操作。

#### Scenario: 对多 Agent 注入相同资源
- **WHEN** 用户选中了 opencode 和 codex
- **THEN** 系统 SHALL 先将选定资源注入 `.opencode/skills/`
- **THEN** 系统 SHALL 再将选定资源注入 `.codex/`
- **THEN** 每个 Agent 的注入结果 SHALL 分别汇总展示

#### Scenario: 某个 Agent 注入失败不影响其他
- **WHEN** 其中一个 Agent 的注入过程出错
- **THEN** 系统 SHALL 继续处理剩余 Agent
- **THEN** 系统 SHALL 在最终汇总中展示每个 Agent 的独立结果

### Requirement: --yes 模式下的 Agent 处理
当 `--yes` 标志生效且无 `--agent` 指定时，系统 SHALL 自动将所有资源注入到全部 `AGENTS` 预设中。

#### Scenario: --yes 注入全部 Agent
- **WHEN** 用户传递 `--yes` 且未指定 `--agent`
- **THEN** 系统 SHALL 将所有可用资源注入到全部 AGENTS 预设的目录
- **THEN** 系统 SHALL NOT 展示任何交互界面
