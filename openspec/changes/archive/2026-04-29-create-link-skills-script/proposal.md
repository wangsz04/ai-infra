## Why

用户编写的技能位于 `skills/` 目录下，但不同 AI 编码 agent（OpenCode、Copilot、Claude Code、Cursor 等）各有自己的配置目录结构。目前需要手动复制技能文件到各 agent 目录，容易遗漏或不同步。需要一个统一脚本来自动将技能链接到目标 agent 目录。

## What Changes

- 新增 `scripts/link-skills.mjs` 脚本
- 创建 `scripts/` 目录
- 脚本通过全局 `SKILLS` 常量定义固定的技能清单，仅链接清单中的技能
- 支持通过 `--agent` 预设或 `--target` 自定义路径将技能软链接到目标目录
- 冲突时提示用户确认是否覆盖
- 预留可扩展的 agent 配置数据结构和技能清单，便于后续适配 codex、claude、cursor 等
- 在 `package.json` 的 `postinstall` 脚本中自动调用，安装依赖后自动链接技能

## Capabilities

### New Capabilities
- `link-skills`: 将 `SKILLS` 常量中定义的固定技能清单通过软链接安装到指定 agent 的配置目录，支持路径扁平化映射、冲突检测与确认覆盖

### Modified Capabilities

（无）

## Impact

- 新增 `scripts/` 目录及 `link-skills.mjs` 脚本
- 修改 `package.json` scripts，添加 `link-skills` 和 `postinstall` 入口
- 新增依赖：picocolors（轻量终端颜色库）
