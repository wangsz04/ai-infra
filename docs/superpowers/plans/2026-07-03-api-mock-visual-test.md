# API Mock Visual Test Skill 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个 OpenCode Skill，使 AI Agent 能通过 Playwright MCP 对 C 端项目进行声明式接口场景可视化测试

**Architecture:** 基于 OpenCode Skill 封装，包含 SKILL.md（工作流指令）、JSON Schema（YAML 校验）、模板文件、示例文件。Skill 加载后 AI 自动按四步流程执行：场景生成 → mock 构建 → 逐场景执行 → 报告生成

**Tech Stack:** OpenCode Skill 系统、Playwright MCP、Chrome DevTools MCP

## Global Constraints

- 所有文件路径位于 `.opencode/skills/api-mock-visual-test/`
- Skill 名称：`api-mock-visual-test`（kebab-case）
- SKILL.md 不超过 150 行，简体中文
- YAML 配置版本：`"1.0"`
- 测试截图和报告存储于目标项目的 `test-reports/` 目录
- 支持 page.route() 网络层拦截（Playwright MCP）和 monkey-patch 注入（Chrome DevTools MCP）两种 mock 方式

---

### Task 1: 创建 Skill 目录结构

**Files:**
- Create: `.opencode/skills/api-mock-visual-test/SKILL.md`（空骨架）
- Create: `.opencode/skills/api-mock-visual-test/schema/test-scenarios.schema.json`（空文件）
- Create: `.opencode/skills/api-mock-visual-test/templates/test-scenarios.yaml`（空文件）
- Create: `.opencode/skills/api-mock-visual-test/examples/example-scenarios.yaml`（空文件）

**Interfaces:**
- Produces: 目录结构，后续任务填充各文件

- [ ] **Step 1: 创建目录和空文件占位**

```powershell
New-Item -ItemType Directory -Path ".opencode\skills\api-mock-visual-test\schema" -Force
New-Item -ItemType Directory -Path ".opencode\skills\api-mock-visual-test\templates" -Force
New-Item -ItemType Directory -Path ".opencode\skills\api-mock-visual-test\examples" -Force
New-Item -ItemType File -Path ".opencode\skills\api-mock-visual-test\SKILL.md" -Force
New-Item -ItemType File -Path ".opencode\skills\api-mock-visual-test\schema\test-scenarios.schema.json" -Force
New-Item -ItemType File -Path ".opencode\skills\api-mock-visual-test\templates\test-scenarios.yaml" -Force
New-Item -ItemType File -Path ".opencode\skills\api-mock-visual-test\examples\example-scenarios.yaml" -Force
```

- [ ] **Step 2: 验证目录结构**

Run: `Get-ChildItem -Recurse -Path ".opencode\skills\api-mock-visual-test" | Select-Object FullName`
Expected: 输出包含 4 个文件路径

- [ ] **Step 3: Commit**

```powershell
git add .opencode/skills/api-mock-visual-test/
git commit -m "feat(test): 创建 api-mock-visual-test skill 目录结构"
```

---

### Task 2: 创建 YAML JSON Schema

**Files:**
- Create: `.opencode/skills/api-mock-visual-test/schema/test-scenarios.schema.json`

**Interfaces:**
- Produces: JSON Schema (draft-07) 校验 test-scenarios.yaml 格式
- 定义顶层属性：version(string), project(object), targets(object), scenarios(array)
- Scenario：name(string,required), description, tags, figma, isolated, mock, setup, steps(required)
- Mock：url(string,required), method(enum), status, delay, response(required), description, times
- Step：action(enum,required), description, url, target, timeout, value, values, key, filePath, script, message, direction, distance, compare, expect, type, stability
- Compare：type(enum,required), expect, nodeId, tolerance, baseline
- action 枚举：navigate, wait, click, fill, select, hover, scroll, pressKey, upload, screenshot, assert, evaluate, pause

- [ ] **Step 1: 编写并写入 JSON Schema**

Write File: `.opencode/skills/api-mock-visual-test/schema/test-scenarios.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Test Scenarios Configuration",
  "description": "API Mock Visual Test 测试场景配置格式定义",
  "type": "object",
  "required": ["version", "scenarios"],
  "properties": {
    "version": { "type": "string", "description": "配置格式版本号" },
    "project": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "项目名称" },
        "baseUrl": { "type": "string", "format": "uri", "description": "测试环境地址" },
        "figma": { "type": "string", "format": "uri", "description": "全局默认 Figma 文件链接" }
      }
    },
    "targets": {
      "type": "object",
      "properties": {
        "web": {
          "type": "object",
          "properties": {
            "viewport": {
              "type": "object",
              "properties": {
                "width": { "type": "integer" },
                "height": { "type": "integer" }
              }
            },
            "deviceScaleFactor": { "type": "number" }
          }
        },
        "miniprogram": {
          "type": "object",
          "properties": {
            "platform": { "enum": ["wechat", "alipay", "bytedance"] },
            "projectPath": { "type": "string" }
          }
        }
      }
    },
    "scenarios": {
      "type": "array",
      "items": { "$ref": "#/definitions/Scenario" }
    }
  },
  "definitions": {
    "Scenario": {
      "type": "object",
      "required": ["name", "steps"],
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "figma": { "type": "string", "format": "uri" },
        "isolated": { "type": "boolean", "default": false },
        "mock": { "type": "array", "items": { "$ref": "#/definitions/Mock" } },
        "setup": { "type": "array", "items": { "$ref": "#/definitions/Step" } },
        "steps": { "type": "array", "items": { "$ref": "#/definitions/Step" } }
      }
    },
    "Mock": {
      "type": "object",
      "required": ["url", "method", "response"],
      "properties": {
        "url": { "type": "string" },
        "method": { "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"] },
        "status": { "type": "integer", "default": 200 },
        "delay": { "type": "integer", "default": 0 },
        "response": {},
        "description": { "type": "string" },
        "times": { "type": "integer" }
      }
    },
    "Step": {
      "type": "object",
      "required": ["action"],
      "properties": {
        "action": {
          "enum": ["navigate", "wait", "click", "fill", "select", "hover", "scroll", "pressKey", "upload", "screenshot", "assert", "evaluate", "pause"]
        },
        "description": { "type": "string" },
        "url": { "type": "string" },
        "target": {
          "oneOf": [
            { "type": "string" },
            { "type": "object", "properties": { "selector": { "type": "string" }, "text": { "type": "string" }, "role": { "type": "string" }, "name": { "type": "string" } } }
          ]
        },
        "timeout": { "type": "integer" },
        "value": { "type": "string" },
        "values": { "type": "array", "items": { "type": "string" } },
        "key": { "type": "string" },
        "filePath": { "type": "string" },
        "script": { "type": "string" },
        "message": { "type": "string" },
        "direction": { "enum": ["up", "down", "left", "right"] },
        "distance": { "type": "integer" },
        "compare": { "type": "array", "items": { "$ref": "#/definitions/Compare" } },
        "expect": { "type": "string" },
        "type": { "enum": ["visible", "hidden", "text", "count", "attribute"] },
        "stability": {
          "type": "object",
          "properties": {
            "networkIdle": { "type": "boolean" },
            "animationEnd": { "type": "boolean" },
            "domStable": { "type": "boolean" },
            "timeout": { "type": "integer" }
          }
        }
      }
    },
    "Compare": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": { "enum": ["semantic", "figma", "baseline"] },
        "expect": { "type": "string" },
        "nodeId": { "type": "string" },
        "tolerance": { "enum": ["low", "medium", "high"], "default": "medium" },
        "baseline": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 2: 验证 Schema 自身是合法 JSON**

Run: `node -e "const s=require('.opencode/skills/api-mock-visual-test/schema/test-scenarios.schema.json'); console.log('title:', s.title); console.log('required:', s.required); console.log('definitions:', Object.keys(s.definitions))"`
Expected:
```
title: Test Scenarios Configuration
required: [ 'version', 'scenarios' ]
definitions: [ 'Scenario', 'Mock', 'Step', 'Compare' ]
```

- [ ] **Step 3: Commit**

```powershell
git add .opencode/skills/api-mock-visual-test/schema/
git commit -m "feat(test): 添加 test-scenarios YAML JSON Schema 校验定义"
```

---

### Task 3: 创建 test-scenarios.yaml 项目模板

**Files:**
- Create: `.opencode/skills/api-mock-visual-test/templates/test-scenarios.yaml`

**Interfaces:**
- Produces: 带注释的项目模板 YAML，用户复制到目标项目后填写

- [ ] **Step 1: 编写并写入项目模板**

Write File: `.opencode/skills/api-mock-visual-test/templates/test-scenarios.yaml`

```yaml
# API Mock Visual Test - 测试场景配置模板
# 将此文件复制到目标项目根目录，按实际情况填写
#
# 使用方式：
#   1. 填写 project.name, project.baseUrl
#   2. 填写 scenarios 下的各测试场景
#   3. 运行: @test:run
#
# 字段说明见 SKILL.md 或 schema/test-scenarios.schema.json

version: "1.0"

project:
  name: ""                                 # 项目名称（必填）
  baseUrl: ""                              # 测试环境地址（必填）
  figma: ""                                # Figma 文件链接（可选）

targets:
  web:
    viewport:
      width: 375
      height: 812
    deviceScaleFactor: 2

scenarios:
  # ─── 场景模板 ───
  # - name: "场景名称"                      # 必填
  #   description: "场景描述"               # 供 AI 和人工理解
  #   tags: ["smoke"]                       # 标签，用于过滤执行
  #   isolated: false                       # 是否独立页面执行
  #   figma: ""                             # 场景默认 Figma 节点（可选）
  #   mock:                                 # Mock 接口数据
  #     - url: "/api/path"
  #       method: GET
  #       status: 200
  #       delay: 0
  #       description: "接口说明"
  #       response:
  #         code: 0
  #         data: {}
  #   setup:                                # 前置操作（可选）
  #     - action: navigate
  #       url: "/pages/index"
  #   steps:                                # 操作+验证步骤（必填）
  #     - action: navigate
  #       url: "/pages/xxx"
  #       description: "进入页面"
  #     - action: wait
  #       target: ".main-container"
  #       timeout: 10000
  #     - action: screenshot
  #       description: "验证页面状态"
  #       compare:
  #         - type: semantic
  #           expect: "描述预期看到的页面状态"
  #         - type: figma
  #           tolerance: medium
  #         - type: baseline
  #           baseline: "基线名称"
```

- [ ] **Step 2: Commit**

```powershell
git add .opencode/skills/api-mock-visual-test/templates/
git commit -m "feat(test): 添加 test-scenarios.yaml 项目模板"
```

---

### Task 4: 编写 SKILL.md 主文件

**Files:**
- Create: `.opencode/skills/api-mock-visual-test/SKILL.md`

**Interfaces:**
- Consumes: schema/test-scenarios.schema.json（引用校验格式）, templates/test-scenarios.yaml（引用模板）, examples/example-scenarios.yaml（引用示例）
- Produces: SKILL.md — AI Agent 执行测试的完整工作流指令

- [ ] **Step 1: 编写并写入 SKILL.md**

Write File: `.opencode/skills/api-mock-visual-test/SKILL.md`

```markdown
---
name: api-mock-visual-test
description: C 端项目接口场景可视化测试，通过 Playwright MCP 拦截接口、执行页面操作、AI 截屏对比（语义/Figma/基线），从 Swagger 或接口 JSON 自动生成声明式测试场景并执行验证。支持人工审核点和暂停控制。
---

# API Mock Visual Test — 接口场景可视化测试

声明式、AI 驱动的 C 端前端项目接口场景测试方案。通过 mock 接口数据驱动页面状态变化，自动执行用户操作并 AI 截屏对比验证。

## 适用场景

- 接口数据驱动的页面状态变化（空列表、错误码、特定数据条件等）
- 跨多场景回归测试（每次代码变更后自动跑一遍）
- 跨项目复用（H5、PC Web，小程序需额外适配）

## 前置条件

- 目标页面可通过 HTTP/HTTPS 访问（本地开发服务器或测试环境）
- Playwright MCP 已启用（自动化执行）或 Chrome DevTools MCP 已启用（手动调试）
- Figma MCP 已启用（如需 Figma 对比）

## 配置文件

测试场景使用 `test-scenarios.yaml` 定义，放置在目标项目根目录。格式参见 `schema/test-scenarios.schema.json`，项目模板参见 `templates/test-scenarios.yaml`。

## 工作流

- **STEP1【场景生成】**：用户提供 Swagger 文档 URL 或接口 JSON 数据 + 可选页面 URL/Figma 链接。AI 解析接口 Schema，穷举数据场景（正常/空/异常code/边界值），可选地打开页面探索结构并关联操作步骤，生成 `test-scenarios.yaml`。
- **STEP2【人工审核1】**：用户确认/修改/补充 YAML 中的场景和操作步骤。
- **STEP3【Mock 构建】**：AI 按每场景构建 mock 响应数据，生成 Playwright `page.route()` 拦截脚本。向用户展示预览。
- **STEP4【人工审核2】**：用户确认/微调 mock 数据和操作步骤。
- **STEP5【逐场景执行】**：对每个场景，按以下子步骤循环执行每个操作步骤：
  - **注入 mock**：通过 `playwright_browser_run_code_unsafe` 执行 `page.route()` 拦截脚本设置当前场景所有 mock 规则
  - **执行操作**：调用 Playwright MCP 工具（navigate/click/fill/wait/screenshot 等）
  - **等待页面稳定**：执行 `playwright_browser_evaluate` 检测 network idle + 无 animation + DOM 稳定（默认 500ms 稳定期，最长等待 10s）
  - **截屏并对比**：对 screenshot 步骤执行对比：
    - semantic：调用 `playwright_browser_take_screenshot` + `playwright_browser_snapshot`，AI 分析截图和 snapshot 是否匹配 YAML 中的 `expect` 描述，输出 ✅/❌/⚠️
    - figma：通过 Figma MCP 获取设计节点截图，AI 对比两者布局/颜色/字号/元素差异
    - baseline：与 `test-reports/baselines/` 下的历史基线截图对比
  - **记录结果**：将截图保存到 `test-reports/<timestamp>/`，记录每步通过的对比项和失败的差异描述
  - **人工控制**：每步/每场景间支持暂停（用户说"暂停"）、跳过（用户说"跳过"）、重跑（用户说"重跑"）、切换手动调试（用户说"调试"）
- **STEP6【报告生成】**：输出结构化测试报告，包含通过率统计、每步截图+AI 分析、Figma 还原度差异、问题清单。
- **STEP7【人工审核4】**：用户查看报告，标记通过/不通过/需修复。

## 执行模式

| 模式 | 说明 | 触发方式 |
|------|------|---------|
| 全自动 | 所有场景按序执行，仅在失败时暂停 | `@test:run` |
| 半自动 | 每场景执行完毕后暂停，等待确认继续 | `@test:run --mode semi` |
| 单步 | 每一步操作后暂停 | `@test:run --mode step` |
| 按标签 | 只执行指定标签的场景 | `@test:run --tag smoke` |
| 按场景 | 只执行指定名称的场景 | `@test:run --scenario "名称"` |

## 目标选择器

操作步骤中的 `target` 支持三种简写格式：
- `.class-selector` — CSS 选择器
- `text=按钮文本` — 文本内容匹配
- `button:提交` — ARIA role:name 匹配

也可使用对象格式：`{ selector: ".btn", text: "提交" }`

## Mock 数据来源

- **Swagger 文档**：提供 URL 或本地 JSON 文件路径，AI 从中提取接口定义和示例数据
- **接口返回 JSON**：直接提供真实接口返回的 JSON 数据，AI 构造各场景的变体

## 用户命令

| 命令 | 说明 |
|------|------|
| `@test:init <swagger_url>` | 从 Swagger 生成初始场景配置 |
| `@test:add-scenario` | 手动添加一个测试场景 |
| `@test:run` | 执行全部场景 |
| `@test:run --tag <tag>` | 按标签过滤执行 |
| `@test:run --scenario <name>` | 执行指定场景 |
| `@test:run --mode <mode>` | 指定执行模式（auto/semi/step） |
| `@test:report` | 查看最近一次测试报告 |
| `@test:baseline-update <name>` | 更新指定基线截图 |

## 注意事项

- Playwright 的 `run_code_unsafe` 仅用于注入 `page.route()` 拦截脚本，不执行其他代码
- 测试截图和报告存储在目标项目 `test-reports/` 目录，不自动上传
- 基线截图需人工确认后才更新，防止误覆盖
- 小程序测试需额外配置开发者工具代理，自动化程度低于 Web
```

- [ ] **Step 2: 验证 SKILL.md 行数不超过 150 行**

Run: `(Get-Content ".opencode\skills\api-mock-visual-test\SKILL.md" | Measure-Object -Line).Lines`
Expected: `<= 150`

- [ ] **Step 3: Commit**

```powershell
git add .opencode/skills/api-mock-visual-test/SKILL.md
git commit -m "feat(test): 编写 SKILL.md 完整工作流指令"
```

---

### Task 5: 创建示例场景文件

**Files:**
- Create: `.opencode/skills/api-mock-visual-test/examples/example-scenarios.yaml`

**Interfaces:**
- Produces: 5 个有代表性的示例场景（空数据/正常交互/错误码/网络异常/多次调用）

- [ ] **Step 1: 编写并写入示例场景**

Write File: `.opencode/skills/api-mock-visual-test/examples/example-scenarios.yaml`

```yaml
# API Mock Visual Test - 示例场景
version: "1.0"
project:
  name: "示例项目"
  baseUrl: "https://test.example.com"
  figma: "https://www.figma.com/file/EXAMPLE"
targets:
  web:
    viewport: { width: 375, height: 812 }
    deviceScaleFactor: 2
scenarios:
  # ─── 例1：空状态 ───
  - name: "奖励列表为空"
    description: "接口返回空数据时展示空状态占位图"
    tags: ["smoke", "empty"]
    mock:
      - url: "/api/reward/list"
        method: GET
        response: { code: 0, data: [] }
        description: "返回空列表"
    steps:
      - action: navigate
        url: "/pages/reward/index"
      - action: wait
        target: ".reward-container"
        timeout: 10000
      - action: screenshot
        compare:
          - type: semantic
            expect: "页面显示空状态提示（如暂无奖励），不应显示奖励列表"

  # ─── 例2：正常数据+交互 ───
  - name: "正常奖励列表-点击领取"
    description: "正常列表展示+点击领取按钮弹窗"
    tags: ["smoke", "interaction"]
    mock:
      - url: "/api/reward/list"
        method: GET
        response:
          code: 0
          data:
            items:
              - { id: 1, name: "10元优惠券", type: "coupon", status: "available" }
              - { id: 2, name: "限定皮肤", type: "skin", status: "claimed" }
    steps:
      - action: navigate
        url: "/pages/reward/index"
      - action: wait
        target: ".reward-list"
        timeout: 10000
      - action: screenshot
        compare:
          - type: semantic
            expect: "展示2条奖励，第1条有立即领取按钮，第2条显示已领取"
      - action: click
        target: "text=立即领取"
      - action: wait
        target: ".claim-dialog"
        timeout: 5000
      - action: screenshot
        compare:
          - type: semantic
            expect: "弹出领取确认弹窗，展示奖励名称，包含确认和取消按钮"

  # ─── 例3：错误码 ───
  - name: "接口返回登录过期code=30000"
    description: "接口返回需重新登录的错误码"
    tags: ["error", "login"]
    mock:
      - url: "/api/reward/list"
        method: GET
        response: { code: 30000, msg: "登录已过期", data: null }
    steps:
      - action: navigate
        url: "/pages/reward/index"
      - action: wait
        target: ".login-dialog"
        timeout: 5000
      - action: screenshot
        compare:
          - type: semantic
            expect: "弹出登录过期提示或跳转登录页"

  # ─── 例4：网络异常 ───
  - name: "接口500服务器异常"
    description: "接口返回500时展示错误页"
    tags: ["error", "network"]
    mock:
      - url: "/api/reward/list"
        method: GET
        status: 500
        response: { code: 500, msg: "服务器繁忙" }
    steps:
      - action: navigate
        url: "/pages/reward/index"
      - action: wait
        target: ".error-container"
        timeout: 10000
      - action: screenshot
        compare:
          - type: semantic
            expect: "展示网络异常提示（如网络异常请稍后重试），包含重试按钮"

  # ─── 例5：多次接口调用 ───
  - name: "先空列表再刷出数据"
    description: "首次空列表，触发操作后重新请求返回数据"
    tags: ["interaction", "refresh"]
    mock:
      - url: "/api/reward/list"
        method: GET
        response: { code: 0, data: [] }
        times: 1
        description: "第1次调用空列表"
      - url: "/api/reward/list"
        method: GET
        response:
          code: 0
          data:
            items:
              - { id: 1, name: "新手礼包", type: "gift" }
        times: 1
        description: "第2次调用有数据"
    steps:
      - action: navigate
        url: "/pages/reward/index"
      - action: wait
        target: ".empty-state"
        timeout: 5000
      - action: screenshot
        compare:
          - type: semantic
            expect: "显示空状态提示"
      - action: click
        target: "text=刷新"
      - action: wait
        target: ".reward-item"
        timeout: 5000
      - action: screenshot
        compare:
          - type: semantic
            expect: "显示新手礼包条目，空状态已消失"
```

- [ ] **Step 2: 验证 YAML 文件可读**

Run: `node -e "const fs=require('fs'); const c=fs.readFileSync('.opencode/skills/api-mock-visual-test/examples/example-scenarios.yaml','utf8'); console.log('Size:', c.length, 'bytes')"`
Expected: `Size: > 0 bytes`

- [ ] **Step 3: Commit**

```powershell
git add .opencode/skills/api-mock-visual-test/examples/
git commit -m "feat(test): 添加 5 个示例测试场景"
```

---

### Task 6: 集成验证

**Files:**
- No changes — 验证所有已创建文件

**Interfaces:**
- Consumes: 所有已创建的 skill 文件

- [ ] **Step 1: 验证目录结构完整性**

Run: `Get-ChildItem -Recurse -Path ".opencode\skills\api-mock-visual-test" | Select-Object FullName, Length | Format-Table -AutoSize`
Expected: 输出应包含以下文件且 Length > 0：
```
.opencode\skills\api-mock-visual-test\SKILL.md
.opencode\skills\api-mock-visual-test\schema\test-scenarios.schema.json
.opencode\skills\api-mock-visual-test\templates\test-scenarios.yaml
.opencode\skills\api-mock-visual-test\examples\example-scenarios.yaml
```

- [ ] **Step 2: 验证 SKILL.md frontmatter**

Run: `Get-Content ".opencode\skills\api-mock-visual-test\SKILL.md" -First 5`
Expected: 首行以 `---` 开头，包含 `name: api-mock-visual-test` 和 `description:` 字段

- [ ] **Step 3: 验证 JSON Schema 有效性**

Run: `node -e "const s=require('.opencode/skills/api-mock-visual-test/schema/test-scenarios.schema.json'); console.log('title:', s.title); console.log('required:', s.required); console.log('defs:', Object.keys(s.definitions).join(', '))"`
Expected:
```
title: Test Scenarios Configuration
required: version,scenarios
defs: Scenario, Mock, Step, Compare
```

- [ ] **Step 4: 验证 SKILL.md 行数**

Run: `(Get-Content ".opencode\skills\api-mock-visual-test\SKILL.md" | Measure-Object -Line).Lines`
Expected: `<= 150`

- [ ] **Step 5: 最终 Commit（如有遗漏修正）**

```powershell
git add -A .opencode/skills/api-mock-visual-test/
git commit -m "chore(test): 集成验证通过"
```
