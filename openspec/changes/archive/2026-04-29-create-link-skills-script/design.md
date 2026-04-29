## Context

项目 `skills/` 下按 `<category>/<name>` 组织用户技能。不同 AI agent（OpenCode、Copilot、Claude Code、Cursor）各有独立的配置目录。需要一个可扩展的链接脚本，将技能安装到各 agent 目录，并支持软链接保持源目录同步。脚本仅在本项目本地使用，通过 `postinstall` 自动执行。

## Goals / Non-Goals

**Goals:**
- 创建 `scripts/link-skills.mjs` 脚本
- 支持通过 `--agent <name>` 选择预设 agent 目标目录
- 支持通过 `--target <path>` 指定自定义目标目录（与 `--agent` 互斥）
- 支持 `--dry-run` 预览模式
- 支持 `--yes` 跳过确认（CI / postinstall 场景）
- 仅链接 `SKILLS` 常量中定义的固定技能清单（非扫描全部）
- `skills/<category>/<name>` 扁平化为 `<target>/<name>`
- 冲突检测：目标目录已存在同名目录时，提示用户确认是否覆盖
- 预留 agent 配置数据结构，方便后续扩展
- 在 `package.json` scripts 中添加 `postinstall` 自动调用脚本
- 新增 picocolors 依赖（轻量终端颜色库）

**Non-Goals:**
- 本次不处理 codex/claude/cursor 的手动适配逻辑（仅占位）
- 不通过 npx 调用，不添加 bin 字段
- 不上传到 npm
- 不处理 Windows 上软链接的权限/管理员问题（先按软链接实现，后续发现问题再调整）
- 使用 picocolors 提供可视化 CLI 输出

## Decisions

| 决策 | 选择 | 理由 | 替代方案 |
|------|------|------|----------|
| 终端输出 | picocolors | 15KB、无依赖、支持 CJS/ESM | chalk（100KB+）/ 纯文本 |
| 文件格式 | .mjs（ESM） | 现代 Node.js 标准，支持 `import` | .cjs / .js |
| CLI 解析 | 手写（无依赖） | 参数简单，无需引入 yargs/commander | commander / yargs |
| 链接范围 | 固定 `SKILLS` 常量 | 明确控制哪些技能被链接，避免意外链接 | 扫描全部 skills/ |
| 链接策略 | flatten（去除 category 层） | 目标 agent 技能目录是扁平的，无需嵌套 | mirror（保留 category） |
| 冲突处理 | 逐项提示确认 | 安全第一，避免误覆盖 | 自动覆盖 / 跳过 |
| 配置结构 | 对象常量 `AGENTS` + 数组常量 `SKILLS` | 零依赖、直观、易扩展 | JSON/YAML 配置文件 |
| 自动执行 | postinstall | 安装依赖后自动链接，无需手动运行 | prepare / 手动 |

## Architecture

```
link-skills.mjs
├── 1. parseArgs()         → CLI 参数解析
├── 2. resolveTarget()     → 确定目标目录
├── 3. resolveSkills()     → 从 SKILLS 常量解析技能列表
├── 4. detectConflicts()   → 检测目标目录冲突
├── 5. resolveConflicts()  → 用户交互确认
├── 6. createLinks()       → 执行软链接
└── 7. printSummary()      → 输出结果摘要

SKILLS 常量:
[
  { category: 'agent', name: 'skill-create' },
]

AGENTS 配置:
{
  opencode: { label, dir, strategy: 'flatten', desc },
  codex:    { label, dir, strategy: 'manual',   desc },
  claude:   { label, dir, strategy: 'manual',   desc },
  cursor:   { label, dir, strategy: 'manual',   desc },
}
```

## Risks / Trade-offs

- [Windows 软链接] → 先按 `fs.symlink` 实现，如遇问题后续切换到 `junction` 或复制模式
- [冲突误覆盖] → 每次冲突均提示确认，`--yes` 跳过确认但风险自担
- [同步问题] → 软链接保障源更新自动同步到目标；但删除源后目标会断链，需重新运行脚本
- [postinstall 在 CI 中执行] → CI 环境可能不需要链接技能，可通过 `--yes` 或环境变量控制
