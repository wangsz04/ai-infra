## 1. Agent 选择模块（新增）

- [x] 1.1 创建 `src/ui/select-agents.js`，实现 `selectAgents(agentKeys, autoYes)` 函数
  - `autoYes=true` 时直接返回全部 agentKeys
  - 使用 `@clack/prompts` 的 `multiselect`，每个选项展示 Agent 的 label 和 desc
  - Esc 取消 → 调用 outro() 输出 "Cancelled." 并 `process.exit(0)`
  - 未选中任何 Agent 确认时 → 输出警告并退出
  - 返回选中的 agentKey 字符串数组
  - 头部使用 intro() 展示配置标题
- [x] 1.2 添加 JSDoc 类型注释，引用 `AGENTS` 常量类型

## 2. 分层资源选择（重写 selectResources）

- [x] 2.1 在 `src/ui/select.js` 中实现分层选择流程
  - `autoYes=true` 时保持原有行为（直接返回全部）
  - intro() 展示 agentLabel + targetDir
- [x] 2.2 实现类型选择层（Layer 1）
  - 从 availableResources 提取所有唯一 type（skill、rule 等）
  - 如果仅 1 种类型 → 自动选中并跳过此层
  - 使用 `multiselect` 展示类型选项供多选
  - Esc 取消 → 退出
- [x] 2.3 实现类别选择层（Layer 2）
  - 对每个被选中类型，提取其下所有唯一 category
  - 如果某类型下仅 1 个类别 → 自动选中并跳过该类型的类别选择
  - 使用 `multiselect` 展示类别选项供多选
  - Esc 取消 → 退出
- [x] 2.4 实现资源选择层（Layer 3）
  - 按选中的 type + category 组合过滤 availableResources
  - 使用 `multiselect` 展示过滤后的资源列表
  - 对已存在的资源标记黄色 "(exists)" 提示（复用现有逻辑）
  - Esc 取消 → 退出
  - 空选择确认 → 输出 "No resources selected. Exiting." 并退出
- [x] 2.5 实现选择结果转换
  - 将选中值解析为 InjectionItem[] 数组
  - outro() 输出 "Selected N resource(s) for <agentLabel>"
  - 保持返回类型和数据结构与现有实现完全一致

## 3. CLI 主流程改造

- [x] 3.1 修改 `src/cli/index.js`
  - 移除 `detectAgents` 的 import 和调用
  - 新流程：
    - 若 `--agent <name>` 指定 → 直接使用该 Agent，跳过 Agent 选择
    - 否则 → 调用 `selectAgents(Object.keys(AGENTS), autoYes)` 获取选中 Agent 列表
    - 扫描资源：`scanResources()`
    - 调用 `selectResources()` 获取选中资源（只执行一次）
    - 对每个选中 Agent 循环调用 `copyFiles()` + `printSummary()`
    - 每个 Agent 的注入失败不影响其他 Agent
- [x] 3.2 实现多 Agent 注入循环的错误隔离
  - 每个 Agent 的 copyFiles 操作独立 try/catch
  - 失败的 Agent 输出错误但继续处理后续 Agent
  - 最终 exit code：任一 Agent 失败则 exit(1)

## 4. 清理与验证

- [x] 4.1 删除 `src/agents/detect.js`（确认无外部依赖）
- [x] 4.2 手动验证交互流程：无参数启动 → Agent 多选 → 类型选择 → 类别选择 → 资源选择 → 多 Agent 注入
- [x] 4.3 手动验证 --agent 跳过 Agent 层：`wangsz-ai --agent opencode` → 直接进入资源分层选择
- [x] 4.4 手动验证 --yes 行为：`wangsz-ai --yes` → 全选资源注入全部 Agent；`wangsz-ai --yes --agent opencode` → 全选资源注入 opencode
- [x] 4.5 手动验证 --dry-run 预览模式：展示但不实际写入文件
- [x] 4.6 手动验证 Esc 取消：在任意选择层按 Esc 均退出并显示 \"Cancelled.\"
