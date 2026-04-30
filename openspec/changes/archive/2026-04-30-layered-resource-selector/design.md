## 上下文

`wangsz-ai` CLI 当前在 `src/cli/index.js` 中串行执行以下流程：
1. `detectAgents()` — 通过检测 cwd 中存在的目录来发现 Agent，0 个则退出，>1 个则报错要求用户用 `--agent` 指定
2. `scanResources()` — 扫描 `RESOURCES` 常量中定义的所有 skill/rule
3. `selectResources()` — 单一扁平 multiselect 列出所有资源（按 Skills/Rules 分段），返回 `InjectionItem[]`
4. `copyFiles()` + `printSummary()` — 注入并汇总

核心约束：当前代码一次只处理一个 Agent，`detectAgents` 在交互层之外就确定了目标。

## 目标 / 非目标

**目标：**
- 在无 `--agent` 时，展示全部 Agent 预设供用户多选
- 资源选择改为分层向导：类型 → 类别 → 资源，每层可选
- 支持多 Agent 批量注入同一批资源
- 保持 `selectResources()` 函数签名和返回值不变（向后兼容）
- 保留 `--yes`、`--dry-run`、`(exists)` 提示、Esc 取消等所有现有行为

**非目标：**
- 不修改 `RESOURCES` 常量结构
- 不修改 `copyFiles` / `printSummary` / `conflict` 模块
- 不新增 npm 依赖
- 不改变 `--agent` 参数的行为（显式指定时跳过 Agent 选择层）

## 决策

### 1. Act 架构：`index.js` > Agent选择 > 资源选择 > 多Agent 注入循环

将 Agent 选择逻辑放在 `index.js` 中编排，而非嵌入 `selectResources`：

```
index.js 流程:
  if (args.agent) → 单 Agent，直接进入资源选择
  else → selectAgents()  → 多选 Agent 预设
       → selectResources() → 分层资源选择（只执行一次）
       → for each selected agent:
           copyFiles(items, { targetDir: agent.targetDir })
           printSummary(results, agent.label)
```

**理由**：`selectResources` 不需要知道 Agent 多选的细节。Agent 选择和资源选择是正交的——Agent 决定"往哪装"，资源决定"装什么"。合在一起会违反单一职责。

**备选方案**：在 `selectResources` 内部集成 Agent 选择 → 放弃，因为 `selectResources` 签名是 `(resources, agentLabel, targetDir, autoYes)`，集成后意味着每次调用都要传入所有 Agent 列表，增加耦合。

### 2. 新增 `src/ui/select-agents.js` 模块

从 `select.js` 中分离出 Agent 选择逻辑为独立模块：

```js
// select-agents.js
export async function selectAgents(agentKeys, autoYes) → string[]
```

- `agentKeys`: 要展示的 Agent key 列表（通常来自 `Object.keys(AGENTS)`）
- `autoYes`: 为 true 时直接返回全部
- 返回用户选中的 Agent key 数组
- 使用 `@clack/prompts` 的 `multiselect`，展示 label + desc
- Esc 取消 → 退出进程

**理由**：Agent 选择和资源选择是不同的关注点，独立模块更容易测试和维护。

### 3. `selectResources` 内部实现分层选择

在 `selectResources` 内部重新实现交互逻辑，但保持对外签名不变：

```
selectResources() 内部流程:
  1. autoYes? → 返回全部（不变）
  2. intro() 展示 agentLabel + targetDir
  3. Layer 1: 类型选择 (multiselect: skill, rule)
     - 如果只有 1 种类型 → 跳过
  4. Layer 2: 对每个选中类型，类别选择 (multiselect)
     - 如果某类型下只有 1 个类别 → 跳过
  5. Layer 3: 资源选择 (multiselect, 按 type+category 过滤)
  6. outro() 汇总 → 返回 InjectionItem[]
```

**理由**：单一模块内的多层 multiselect 串行调用，利用 `@clack/prompts` 的 `multiselect` API 天然支持多次调用。不需要实现自定义导航组件。

### 4. `detectAgents` 废弃并删除

`src/agents/detect.js` 的 `detectAgents()` 将在新流程中不再使用：
- `index.js` 不再调用 `detectAgents()`
- `--agent <name>` 直接使用该 Agent
- 无 `--agent` 时，调用 `selectAgents()` 展示全部 Agent
- `src/agents/detect.js` 可直接删除（经确认，`link-skills` 等脚本均不依赖此模块）

**理由**：用户需求是展示全部 Agent 预设而非仅限已检测到的。`detectAgents` 仅被 `index.js` 引用，无其他调用方，可安全移除。

### 5. `--yes` 行为扩展

| 场景 | 原行为 | 新行为 |
|------|--------|--------|
| `--yes` | 全选资源注入到检测到的唯一 Agent | 全选资源注入到**全部 AGENTS 预设** |
| `--yes --agent X` | 全选资源注入到 X | 同左（不变） |

`--yes` 无 `--agent` 时，行为从"注入到自动检测的 Agent"变为"注入到所有预设 Agent"。这消除了对 `detectAgents()` 的依赖。

### 6. `summary.js` 不需要改动

`printSummary(results, agentLabel)` 的签名保持不变。多 Agent 循环时，每个 Agent 独立调用一次 `printSummary`，在终端中连续展示多个汇总表。这是最简单且视觉清晰的方案。

**备选方案**：改造 Summary 为多 Agent 合并表格 → 放弃，额外复杂度不带来实质收益。

### 7. 资源过滤数据流

```
AvailableResource[] (全量)
    ↓
按 type 分组: { skill: [...], rule: [...] }
    ↓
类型层选择 → 过滤到选中类型
    ↓
按 category 分组（仅选中类型内）
    ↓
类别层选择 → 过滤到选中类别
    ↓
按 name 列出（仅选中 type + category 组合内）
    ↓
资源层选择 → 最终 InjectionItem[]
```

过滤使用 `Map<string, AvailableResource[]>` 进行 O(n) 分组，纯函数实现，不修改原始数组。

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| `--yes` 改为注入全部 Agent 可能意外写入不想要的目录 | `--dry-run` 预览模式让用户确认；文档说明新行为 |
| 多 Agent 注入时，某个 Agent 失败会影响整体体验 | 每个 Agent 独立 try/catch，失败不阻塞其他 Agent |
| 分层向导层数过多可能让用户觉得繁琐 | 当某层只有 1 个选项时自动跳过，减少无效步骤 |

## 待定问题

1. **`--yes` 无 `--agent` 时注入全部 Agent**：这是合理的默认行为吗？还是应该更保守（如注入到仅 cwd 中存在的 Agent 目录）？
2. **多 Agent 注入顺序**：是否需要排序或优先注入某个 Agent？当前决策是按 `Object.keys(AGENTS)` 的插入顺序。
3. **Agent 选择层是否需要显示目录状态**：如标记"该 Agent 目录已存在"vs"将新建"？
