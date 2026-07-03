# C 端项目接口场景可视化测试方案

## 一、目标与范围

### 1.1 目标

提供一套声明式、AI 驱动的 C 端前端项目接口场景测试方案，实现：

- **接口场景全覆盖**：覆盖正常数据、空数据、异常 code、边界值等所有接口返回场景
- **操作自动化**：自动触发页面交互（点击、输入、滚动等），无需人工逐一手动操作
- **视觉智能验证**：AI 对每步操作结果进行截屏对比，替代传统人工肉眼核验
- **跨项目复用**：统一的 YAML 配置格式，可快速迁移到不同 C 端项目
- **人工可控**：关键节点提供人工审核/暂停/干预能力

### 1.2 适用范围

| 维度 | 范围 |
|------|------|
| 项目类型 | H5 活动页、PC Web、微信/支付宝/字节小程序 |
| 测试场景 | 接口数据驱动的页面状态变化（空列表、错误码、特定数据条件等） |
| 验证方式 | AI 语义断言 + 历史基线对比 + Figma 设计稿对比 |
| 执行工具 | Playwright MCP（自动化）、Chrome DevTools MCP（手动调试） |
| Mock 数据来源 | Swagger/OpenAPI 文档、真实接口返回 JSON |

---

## 二、整体架构

```
用户输入（Swagger / 接口JSON / Figma链接 / 页面URL）
        │
        ▼
  ┌──────────────────────────────┐
  │ ① 场景自动生成                │
  │   AI 解析接口 Schema → 穷举   │
  │   数据场景 → 分析页面结构 →    │
  │   关联操作步骤 → 生成          │
  │   test-scenarios.yaml         │
  └────────────┬─────────────────┘
               │
     【🔴 人工审核点 1】用户确认/修改/补充测试场景
               │
               ▼
  ┌──────────────────────────────┐
  │ ② Mock 数据 + 操作脚本构建    │
  │   AI 按每场景构建 mock 响应    │
  │   数据 + 生成 Playwright       │
  │   操作脚本                     │
  └────────────┬─────────────────┘
               │
     【🔴 人工审核点 2】用户确认/微调 mock 数据与操作步骤
               │
               ▼
  ┌──────────────────────────────────────────────────────┐
  │ ③ 逐场景执行（每场景独立，场景间共享浏览器会话）       │
  │                                                       │
  │  单个场景循环：                                       │
  │  ┌──────────┐   ┌──────────────┐   ┌──────────────┐  │
  │  │ 注入 mock │ → │ 执行操作步骤  │ → │ AI 截屏对比   │  │
  │  │ (route   │   │ (click/fill/ │   │ (语义+基线+   │  │
  │  │  拦截)   │   │  scroll/...) │   │  Figma)       │  │
  │  └──────────┘   └──────────────┘   └──────┬───────┘  │
  │                                           │           │
  │                                    记录结果+截图       │
  │                                                       │
  │  【🔴 人工控制点 3】每步/每场景间：                     │
  │     · 暂停继续  · 跳过当前步骤/场景                    │
  │     · 重跑当前步骤  · 手动操作页面后继续               │
  │     · 切换到 chrome-devtool-mcp 手动调试               │
  └──────────────────────────────────────────────────────┘
               │
     【🔴 人工审核点 4】用户查看测试报告，标记通过/不通过/需修复
               │
               ▼
  ┌──────────────────────────────┐
  │ ④ 生成结构化测试报告          │
  │   · 通过率统计               │
  │   · 每步骤截图 + AI 分析结论  │
  │   · Figma 还原度差异点       │
  │   · 问题清单（按严重度排序）  │
  └──────────────────────────────┘
```

---

## 三、test-scenarios.yaml 配置规范

### 3.1 顶层结构

```yaml
# test-scenarios.yaml
version: "1.0"
project:
  name: "项目名称"
  baseUrl: "https://test.example.com"       # 测试环境地址
  figma: "https://www.figma.com/file/xxx"   # 全局默认 Figma 文件（可选）
targets:                                     # 多端配置
  web:                                       # H5 / PC Web
    viewport: { width: 375, height: 812 }    # 默认视口
    deviceScaleFactor: 2
  miniprogram:                               # 小程序（可选）
    platform: wechat                         # wechat | alipay | bytedance
    projectPath: "./dist"                    # 小程序构建产物路径

scenarios:                                   # 场景列表
  - name: "场景名称"
    description: "场景描述（供AI理解和人工阅读）"
    tags: ["smoke", "reward"]                # 标签，用于过滤执行
    figma: "https://..."                     # 场景默认 Figma 节点（可选，不指定 step 级 figma 对比时使用此值）
    mock: [...]                              # Mock 配置列表
    setup: [...]                             # 场景前置操作（可选，如登录、跳转特定页面）
    steps: [...]                             # 操作+验证步骤
```

### 3.2 Mock 配置

```yaml
mock:
  - url: "/api/reward/list"                  # 拦截的 URL（支持正则:/api/reward/.*）
    method: GET                              # HTTP 方法
    status: 200                              # HTTP 状态码
    delay: 0                                 # 模拟延迟（ms），用于测试 loading 状态
    response:                                # 响应体（JSON）
      code: 0
      data:
        items:
          - id: 1
            name: "奖励A"
            type: "coupon"
            status: "available"
    description: "正常奖励列表"               # 该 mock 的语义说明
    times: 1                                 # 可选：该 mock 生效次数，不填则始终生效
```

**多次调用同一接口返回不同数据**：

当场景中同一接口被多次调用且每次返回不同数据时：

```yaml
mock:
  - url: "/api/reward/list"
    method: GET
    response:
      code: 0
      data: []
    description: "第1次调用：空列表"
    times: 1                                 # 仅第 1 次生效
  - url: "/api/reward/list"
    method: GET
    response:
      code: 0
      data:
        items:
          - id: 1
            name: "新奖励"
    description: "第2次调用：有数据"
    times: 1                                 # 仅第 2 次生效
```

未指定 `times` 的 mock 规则始终生效，按定义顺序匹配。AI 自动为同一 URL 的多条 mock 分配序列计数器。

### 3.3 操作步骤

#### 3.3.1 可用操作类型

| action | 说明 | 参数 |
|--------|------|------|
| `navigate` | 导航到页面 | `url` |
| `wait` | 等待元素出现/消失 | `target`, `timeout` |
| `click` | 点击 | `target` |
| `fill` | 输入 | `target`, `value` |
| `select` | 下拉选择 | `target`, `values: []` |
| `hover` | 悬停 | `target` |
| `scroll` | 滚动 | `target`, `direction`, `distance` |
| `pressKey` | 按键 | `key` |
| `upload` | 上传文件 | `target`, `filePath` |
| `screenshot` | 截屏并对比 | `compare: []` |
| `assert` | 断言 | `type`, `target`, `value` |
| `evaluate` | 执行 JS | `script` |
| `pause` | 暂停等待人工操作 | `message` |

#### 3.3.2 `target` 选择器

```yaml
# 支持三种选择器格式，按优先级尝试匹配
target:
  selector: ".reward-item"                   # CSS 选择器
  text: "立即领取"                            # 文本内容匹配
  role: "button"                             # ARIA role + name
  name: "提交"
```

简写形式：
```yaml
target: ".reward-item"                       # 纯 CSS 选择器
target: "text=立即领取"                       # text= 前缀 → 文本匹配
target: "button:提交"                         # role:name → ARIA 匹配
```

#### 3.3.3 操作步骤完整示例

```yaml
steps:
  - action: navigate
    url: "/pages/reward/index"
    description: "进入奖励列表页"

  - action: wait
    target: ".reward-list"
    timeout: 10000
    description: "等待列表渲染完成"

  - action: screenshot
    description: "验证空列表状态"
    compare:
      - type: semantic
        expect: "页面显示空状态占位图，文案为'暂无奖励'"
      - type: figma
      - type: baseline
        baseline: "reward_empty_v1"

  - action: click
    target: "text=点击领取"
    description: "点击领取按钮"

  - action: wait
    target: ".claim-dialog"
    timeout: 5000
    description: "等待弹窗出现"

  - action: screenshot
    description: "验证领取弹窗"
    compare:
      - type: semantic
        expect: "弹窗显示奖励详情，包含'确认领取'按钮"
      - type: figma
        nodeId: "3-4"
      - type: baseline
        baseline: "claim_dialog_v1"
```

### 3.4 断言类型

```yaml
# assert 步骤（非截图的纯断言）
- action: assert
  type: visible                             # visible | hidden | text | count | attribute
  target: ".success-toast"
  value: "领取成功"                          # 对 text 类型：期望的文本内容
                                            # 对 count 类型：期望的数量
```

### 3.5 对比配置详解

```yaml
compare:
  - type: semantic                           # 语义对比（必选，至少一个）
    expect: "自然语言描述当前步骤页面的预期状态"
    # AI 根据描述与截图/snapshot 进行语义匹配判断

  - type: figma                              # Figma 设计稿对比（可选）
    nodeId: "1-2"                            # 可选：指定对比的 Figma 节点 ID
    # 不指定则使用步骤级 figma 字段 → 场景级 figma 字段
    tolerance: medium                        # low: 严格 / medium: 一般 / high: 宽松
    # tolerance 含义：
    #   low   - 像素级精确对比（颜色、间距、字号严格一致）
    #   medium - 容忍微小色差和 1-2px 间距偏差
    #   high   - 仅对比元素存在性和大致布局

  - type: baseline                           # 回归基线对比（可选）
    baseline: "baseline_name"                # 基线名称标识
    # 首次执行时自动创建基线；后续执行与此基线对比
```

**Figma 字段解析优先级（从高到低）**：

1. `step.compare[].nodeId` — 步骤级显式指定
2. `scenario.figma` — 场景级默认 Figma 链接
3. `project.figma` — 项目级全局 Figma 文件链接

当 `type: figma` 无有效 Figma 链接时，该对比项自动跳过并记录警告。

---

## 四、AI 截屏对比机制

### 4.0 页面稳定检测

每次操作后、截图前，AI 自动等待页面稳定：

1. **网络空闲**：等待所有进行中的网络请求完成（最长等待 5s）
2. **动画结束**：检测 CSS animation/transition 是否仍在运行
3. **DOM 稳定**：使用 MutationObserver 检测 500ms 内无 DOM 变更
4. **兜底超时**：以上条件未满足时，最多等待 `step.timeout`（默认 10s）后强制截图

```yaml
steps:
  - action: click
    target: ".submit-btn"
    stability:                               # 可选：自定义稳定条件
      networkIdle: true
      animationEnd: true
      domStable: true
      timeout: 8000
```

### 4.1 三维对比模型

```
                  ┌──────────────────┐
                  │   当前页面截屏     │
                  └────────┬─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
 │  语义对比    │   │  Figma 对比  │   │  基线对比    │
 │             │   │             │   │             │
 │ AI 阅读     │   │ AI 对比当前  │   │ 像素级/结构  │
 │ expect 描述  │   │ 截图与设计稿  │   │ 对比历史     │
 │ + 截图      │   │ 的视觉差异   │   │ 通过截图     │
 │ → 判断通过  │   │ → 输出差异点  │   │ → 回归检测   │
 └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
        │                  │                  │
        ▼                  ▼                  ▼
    ✅/❌/⚠️          差异清单            ✅/❌/⚠️
```

### 4.2 语义对比

AI 接收两路输入：
1. **页面截图**（通过 `take_screenshot`）
2. **页面 snapshot**（a11y tree，通过 `take_snapshot` / `snapshot`）
3. **YAML 中的 `expect` 字段**：人类可读的预期状态描述

AI 综合分析后输出：
- `✅ 通过`：页面状态与预期描述一致
- `❌ 不通过`：页面状态与预期描述不符，附具体差异说明
- `⚠️ 存疑`：无法确定，需人工判断，附 AI 的分析依据

### 4.3 Figma 对比

流程：
1. 通过 Figma MCP 获取指定节点的设计稿截图
2. 截取当前页面同区域截图
3. AI 对比两者，输出差异清单：

```
✅ 布局结构一致
⚠️ 主按钮颜色偏差：设计 #FF6600 → 实际 #FF7700
⚠️ 标题字号偏差：设计 18px → 实际 16px
❌ 缺少元素：设计稿中存在"活动规则"链接，页面中未找到
```

### 4.4 基线对比

流程：
1. 首次执行时，将当前截图保存为基线（需人工确认通过后生效）
2. 后续执行时，与基线截图做视觉 diff
3. AI 分析差异是否在可接受范围内
4. 如需更新基线，人工确认后可覆盖

---

## 五、工具分工

### 5.1 工具对比

| 能力 | Playwright MCP | Chrome DevTools MCP |
|------|---------------|---------------------|
| 截图 | `take_screenshot` | `take_screenshot` |
| 页面快照 | `snapshot` | `take_snapshot` |
| 操作模拟 | `click`/`fill`/`type`/`hover` 全系列 | `click`/`fill`/`type`/`hover` 全系列 |
| 网络拦截 | `route()` 原生 API → 需通过 `run_code_unsafe` 注入 | 需通过 `evaluate_script` 注入 monkey-patch |
| JS 执行 | `evaluate` | `evaluate_script` |
| 控制台 | `console_messages` | `list_console_messages` |
| 安装要求 | 需要 `npx playwright install` | 无（内置） |
| 稳定性 | 高（网络层拦截，不被页面代码干扰） | 中（monkey-patch 可能被页面覆盖） |

### 5.2 分工策略

| 阶段 | 使用工具 | 原因 |
|------|---------|------|
| 自动化执行 | **Playwright MCP** | 网络层拦截稳定可靠，操作 API 完善 |
| 人工调试 | **Chrome DevTools MCP** | 可视化 DevTools，方便手动排查 |
| 小程序测试 | Chrome DevTools MCP + 小程序开发者工具代理 | 小程序无标准浏览器环境 |

### 5.3 小程序适配方案

小程序（微信/支付宝/字节）无法直接使用 Playwright，需额外适配：

1. 在小程序开发者工具中配置 HTTP 代理指向本地 mock 服务
2. 使用 Chrome DevTools MCP 连接小程序开发者工具的内置浏览器（需小程序开发者工具开启 Chrome DevTools Protocol 端口，微信开发者工具默认开启，其他平台需确认）
3. 小程序页面通过 `navigateTo` / `redirectTo` API 导航，需通过 `evaluate_script` 调用 `wx.navigateTo()`
4. 小程序组件选择器与 Web DOM 不同，需使用小程序开发者工具的 WXML 面板定位元素
5. 小程序测试自动化程度低于 Web，部分场景需人工辅助操作

### 5.4 安全说明

- Playwright MCP 的 `run_code_unsafe` 等同于远程代码执行，仅用于注入 `page.route()` 拦截脚本，不执行任何其他代码
- Mock 数据仅注入到测试页面的网络层，不修改项目源代码
- 测试截图和报告存储在项目本地 `test-reports/` 目录，不自动上传
- 基线截图需人工确认后才更新，防止误覆盖

---

## 六、工作流详述

### 6.1 步骤① 场景自动生成

**输入**：
- Swagger/OpenAPI JSON 文档路径或 URL
- 或直接提供的接口返回 JSON 数据
- 可选：页面 URL（AI 可访问页面探索结构）
- 可选：Figma 设计稿链接

**AI 处理流程**：

1. **解析接口**：提取所有接口的 path、method、请求/响应 Schema
2. **穷举场景**：对每个接口，根据 Schema 生成场景矩阵
   - `code: 0` + 正常数据
   - `code: 0` + 空列表/空对象
   - `code: 0` + 最大数据量（如 100 条）
   - `code: 0` + 特殊值（如金额 0、负数）
   - 各业务错误 code（如 30000 需登录、40001 参数错误）
   - HTTP 异常（500、超时）
3. **探索页面**（如有 URL）：AI 打开页面，通过 snapshot 分析页面结构，识别关键元素
4. **关联操作**：根据页面识别的元素（按钮、输入框、列表项等），为每个场景生成操作步骤
5. **生成 YAML**：输出 `test-scenarios.yaml`

### 6.2 步骤② Mock 数据构建

AI 根据 YAML 中的 `mock` 配置，为每个场景构建 mock 响应体：

1. 从 Swagger Schema 或用户提供的真实数据中提取响应结构
2. 按 YAML 中描述的语义填充数据（正常值、空值、错误码、边界值等）
3. 生成 Playwright `route()` 拦截脚本
4. 输出预览供用户审核

### 6.3 步骤③ 逐场景执行

#### 执行模式

| 模式 | 说明 |
|------|------|
| **全自动** | 所有场景按序执行，仅在失败时暂停 |
| **半自动** | 每场景执行完毕后暂停，等待用户确认继续 |
| **单步** | 每一步操作后暂停，用户手动触发下一步 |
| **交互式** | 自动执行到指定步骤后暂停，用户手动操作，之后恢复自动 |

用户可在任意时刻通过命令行/输入切换模式。

#### 场景隔离

- 每个场景开始前，注入该场景的 mock 数据
- 场景执行完毕后，清理 mock
- 场景间共享浏览器会话（避免重复登录）
- 如某场景导致页面状态不可恢复（如跳转到外部页面），该场景标记为 `isolated: true`，独立新开页面执行

#### 单步执行流程伪代码

```
for each step in scenario.steps:
    1. 执行 step.action（click/fill/wait/...）
    2. 等待页面稳定（network idle + 无动画）
    3. 截屏 + 取 snapshot
    4. 对 step.compare 中的每项对比类型：
       a. semantic: AI 判断 screenshot + snapshot 是否匹配 expect
       b. figma: 获取 Figma 截图 → AI 对比差异
       c. baseline: 与基线截图做视觉 diff → AI 判断
    5. 记录结果（✅/❌/⚠️ + 截图 + AI 分析文本）
    6. 如有 step.compare 任一 ❌，根据用户配置决定：继续 / 暂停 / 跳过剩余步骤
```

### 6.4 步骤④ 生成测试报告

报告结构：

```
测试报告 - <项目名> - <时间戳>
─────────────────────────────
总览：场景 8/10 通过 | 步骤 42/50 通过 | 通过率 84%

失败项：
  1. [场景: 奖励列表为空] 步骤3/5 ❌ 语义对比不通过
     → 期望"弹窗显示奖励详情"，实际页面无弹窗
     截图: ./reports/2026-07-03/s1_step3.png

  2. [场景: 错误码30000] 步骤2/3 ⚠️ Figma 对比差异
     → 登录按钮颜色偏差 #FF6600 → #FF7700
     设计截图: ./reports/2026-07-03/s2_step2_figma.png
     实际截图: ./reports/2026-07-03/s2_step2_actual.png

Figma 还原度统计：
  · 布局一致性: 92%
  · 颜色准确率: 88%
  · 字体准确率: 95%

基线更新建议：
  · reward_empty_v1 → 建议更新（页面布局已变更）
  · claim_dialog_v1 → 一致，无需更新
```

---

## 七、跨项目复用机制

### 7.1 Skill 封装

整个测试能力封装为一个 OpenCode Skill，目录结构：

```
skills/
└── api-mock-visual-test/
    ├── SKILL.md                  # Skill 入口指令（工作流定义）
    ├── schema/
    │   └── test-scenarios.schema.json   # YAML JSON Schema 校验
    ├── templates/
    │   └── test-scenarios.yaml   # 项目模板
    └── examples/
        └── example-scenarios.yaml
```

Skill 注入到目标项目的 AI Agent 后，AI 即可自动执行完整测试流程。

### 7.2 项目适配流程

对新项目只需：

1. 提供 Swagger 文档或接口 JSON → AI 生成初始 `test-scenarios.yaml`
2. 补充 `project.figma` 和页面 URL
3. 人工审核生成的场景和操作步骤
4. 执行首次测试 → 建立基线
5. 后续每次代码变更，运行 `test-scenarios.yaml` 进行回归

---

## 八、交互命令设计

测试 Skill 加载后，AI 支持以下用户指令：

| 指令 | 说明 |
|------|------|
| `@test:init <swagger_url>` | 从 Swagger 生成初始场景配置 |
| `@test:add-scenario` | 手动添加一个测试场景 |
| `@test:run` | 执行全部场景 |
| `@test:run --tag smoke` | 按标签过滤执行 |
| `@test:run --scenario "名称"` | 执行指定场景 |
| `@test:run --mode step` | 单步执行模式 |
| `@test:report` | 查看最近一次测试报告 |
| `@test:baseline-update <name>` | 更新指定基线截图 |

---

## 九、约束与边界

### 9.1 前提条件

- 测试页面必须可通过 HTTP/HTTPS 访问（本地开发服务器或测试环境）
- 小程序测试需提前配置开发者工具代理
- Figma 对比需 Figma MCP 已连接且有权访问设计文件
- 基线对比需至少执行过一次测试并确认基线

### 9.2 已知局限

- AI 语义对比无法做到 100% 精确（如复杂的动画过渡状态）
- Figma 与真实渲染存在平台差异（字体渲染、抗锯齿等），AI 会标注但不过度报警
- 小程序支持依赖各平台开发者工具，自动化程度低于 Web
- monkey-patch 式 mock 在 SPA 中可能被框架的运行时覆盖（Playwright route 拦截无此问题）

### 9.3 安全考虑

- Mock 数据仅注入到测试页面，不修改源代码
- 测试截图和报告存储在项目本地 `test-reports/` 目录
- 不自动提交基线更新，需人工确认

---

## 十、演进路线

| 阶段 | 内容 |
|------|------|
| **Phase 1** | Skill 基础框架 + YAML 配置规范 + Playwright MCP 执行 + 语义对比 |
| **Phase 2** | Figma 集成对比 + 基线管理 + Swagger 自动解析 |
| **Phase 3** | 小程序适配 + 测试报告可视化 + CI/CD 集成 |
