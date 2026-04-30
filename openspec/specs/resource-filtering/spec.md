## ADDED Requirements

### Requirement: 类型层到类别层的过滤
当用户在类型层选择某些类型后，类别层 SHALL 仅展示被选中类型所关联的类别。

#### Scenario: 仅选中 skill 类型
- **WHEN** 用户在类型层仅选中 `skill`
- **THEN** 类别层 SHALL 仅展示在 skill 资源中存在的类别（如 agent、git、fe）
- **THEN** 类别层 SHALL NOT 展示 rule 资源独有的类别

#### Scenario: 选中多个类型
- **WHEN** 用户在类型层同时选中 `skill` 和 `rule`
- **THEN** 类别层 SHALL 分类型展示各自的类别集合，或合并去重后展示

### Requirement: 类别层到资源层的过滤
当用户选择类型和类别后，资源层 SHALL 仅展示同时匹配已选 type 和已选 category 的资源。

#### Scenario: 按类型+类别组合过滤
- **WHEN** 用户选中 type=`skill` 且 category=`agent`
- **THEN** 资源层 SHALL 仅展示 skill 类型下 agent 类别的资源（如 skill-create、git-worktree-workflow）
- **THEN** 资源层 SHALL NOT 展示同为 skill 类型但属于 git 或 fe 类别的资源

### Requirement: 无可用资源时的处理
当某层过滤后无可用选项时，系统 SHALL 跳过该层并给出适当反馈。

#### Scenario: 某类型下无类别
- **WHEN** 某被选中类型下不存在任何类别（错误状态）
- **THEN** 系统 SHALL 跳过该类型的后续层并给出警告

### Requirement: 资源数据结构兼容
过滤逻辑 SHALL 基于 `AvailableResource` 的 `type` 和 `category` 字段进行，不引入新的数据结构依赖。

#### Scenario: 基于现有字段过滤
- **WHEN** 系统执行过滤
- **THEN** 过滤条件 SHALL 仅依赖 `type` 和 `category` 属性
- **THEN** 过滤逻辑 SHALL NOT 要求修改 `RESOURCES` 常量定义
