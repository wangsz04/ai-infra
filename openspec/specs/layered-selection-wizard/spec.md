## ADDED Requirements

### Requirement: Agent 选择层（前置）
在无 `--agent` 参数时，系统 SHALL 首先展示所有可用 Agent 预设的多选列表，来自 `AGENTS` 常量中定义的全部预设。

#### Scenario: 展示全部 Agent 预设供多选
- **WHEN** 用户未通过 `--agent` 指定 Agent
- **THEN** 系统 SHALL 展示所有 `AGENTS` 常量中定义的 Agent 预设（包括 label 和 desc）供多选
- **THEN** 每个选项 SHALL 显示 Agent 的 label 和 desc 作为提示信息
- **THEN** 用户确认后，系统 SHALL 对每个选中的 Agent 依次执行后续资源分层选择

#### Scenario: 通过 --agent 指定时跳过 Agent 选择层
- **WHEN** 用户通过 `--agent <name>` 显式指定了 Agent
- **THEN** 系统 SHALL 跳过 Agent 选择层，直接对该 Agent 进入资源分层选择

#### Scenario: 多 Agent 批量注入
- **WHEN** 用户选中多个 Agent
- **THEN** 后续资源选择 SHALL 只执行一次（选出同一批资源）
- **THEN** 系统 SHALL 对每个选中的 Agent 目录分别注入这批资源

#### Scenario: Agent 选择层取消
- **WHEN** 用户在 Agent 选择层按下 Esc
- **THEN** 系统 SHALL 输出 "Cancelled." 并以 exit code 0 退出

### Requirement: 分层选择向导流程
在 Agent 确定后，系统 SHALL 提供一个多步骤分层选择向导，引导用户依次选择资源类型（type）→ 类别（category）→ 具体资源（resource），每层使用 @clack/prompts 的 multiselect 组件。

#### Scenario: 三层向导完整流程
- **WHEN** 可用的资源中包含多种 type（如 skill、rule）和多种 category
- **THEN** 系统 SHALL 首先展示类型选择层，列出所有存在的资源类型（如 skill、rule）供用户多选
- **THEN** 用户确认选择后，系统 SHALL 对每个被选中的类型，展示其下存在的所有类别供多选
- **THEN** 用户确认类别选择后，系统 SHALL 展示匹配 type + category 组合的所有资源供最终多选

#### Scenario: 仅有单一类型时跳过第一层
- **WHEN** 可用资源仅包含一种类型
- **THEN** 系统 SHALL 跳过类型选择层，直接进入该类型的类别选择层

#### Scenario: 某类型下仅有单一类别时跳过该类型的类别层
- **WHEN** 某被选中类型下仅包含一种类别
- **THEN** 系统 SHALL 自动将该类别视为已选中，跳过该类型的类别选择层

### Requirement: --yes 自动全选模式
当 `autoYes` 参数为 true 时，系统 SHALL 跳过所有选择层（包括 Agent 选择层），直接使用全部资源面向所有可用 Agent，保持向后兼容。

#### Scenario: --yes 跳过所有交互
- **WHEN** `autoYes` 为 true 且无 `--agent`
- **THEN** 系统 SHALL 不展示任何 multiselect 界面
- **THEN** 系统 SHALL 将全部可用资源注入到所有检测到的（或全部）Agent 目录

#### Scenario: --yes 配合 --agent
- **WHEN** `autoYes` 为 true 且有 `--agent <name>`
- **THEN** 系统 SHALL 跳过所有界面，直接向指定 Agent 注入全部资源

### Requirement: Esc 取消退出
用户在任意选择层按下 Esc 时，系统 SHALL 显示取消消息并退出进程。

#### Scenario: 在类型层取消
- **WHEN** 用户在类型选择层按下 Esc
- **THEN** 系统 SHALL 输出 "Cancelled." 并以 exit code 0 退出

#### Scenario: 在类别层取消
- **WHEN** 用户在类别选择层按下 Esc
- **THEN** 系统 SHALL 输出 "Cancelled." 并以 exit code 0 退出

#### Scenario: 在资源层取消
- **WHEN** 用户在资源选择层按下 Esc
- **THEN** 系统 SHALL 输出 "Cancelled." 并以 exit code 0 退出

### Requirement: 已有资源标记
在资源选择层，系统 SHALL 对目标路径已存在的资源显示 "(exists)" 提示。

#### Scenario: 资源已存在于目标目录
- **WHEN** 某个资源的 targetPath 已存在
- **THEN** 系统 SHALL 在该资源选项旁显示黄色 "(exists)" 提示

### Requirement: 空选择退出
当用户在资源选择层未选择任何资源就确认时，系统 SHALL 提示并退出。

#### Scenario: 最终选择为空
- **WHEN** 用户在资源选择层没有选择任何条目并按下 Enter 确认
- **THEN** 系统 SHALL 输出 "No resources selected. Exiting." 并以 exit code 0 退出

### Requirement: 向导头部信息展示
系统 SHALL 在每个选择层展示统一的头部信息，包括目标 agent 名称和目标目录路径。

#### Scenario: 展示 agent 和目标路径
- **WHEN** 选择向导启动
- **THEN** 系统 SHALL 在首层使用 intro() 展示 agent 名称和目标目录
- **THEN** 后续每层 SHALL 在 prompt message 中包含上下文信息（如当前已选的类型/类别）

### Requirement: 选择结果汇总
向导完成后，系统 SHALL 展示选中资源数量并返回 InjectionItem 数组，签名与现有 `selectResources` 函数完全一致。

#### Scenario: 展示选中结果并返回
- **WHEN** 用户完成所有层的选择
- **THEN** 系统 SHALL 输出 "Selected N resource(s) for <agentLabel>"
- **THEN** 系统 SHALL 返回格式一致的 `InjectionItem[]` 数组
