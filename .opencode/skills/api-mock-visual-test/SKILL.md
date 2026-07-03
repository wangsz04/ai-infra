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
