## 1. 项目初始化

- [x] 1.1 创建 `scripts/` 目录
- [x] 1.2 安装 picocolors 依赖 (`npm install picocolors`)

## 2. 核心脚本实现

- [x] 2.1 创建 `scripts/link-skills.mjs`，编写 shebang 和基础 ESM 结构
- [x] 2.2 实现 `AGENTS` 预设配置数据结构（opencode/codex/claude/cursor）
- [x] 2.3 实现 `parseArgs()` — CLI 参数解析（--agent/-a, --target/-t, --dry-run, --yes, --help/-h），互斥校验
- [x] 2.4 实现 `resolveTarget()` — 根据 --agent 或 --target 确定目标目录
- [x] 2.5 实现 `resolveSkills()` — 从 `SKILLS` 常量解析技能列表，校验源目录存在
- [x] 2.6 实现 `detectConflicts()` — 检测目标目录中已存在的同名目录
- [x] 2.7 实现 `resolveConflicts()` — 逐项提示用户确认覆盖（--yes 跳过）
- [x] 2.8 实现 `createLinks()` — 使用 `fs.symlink` 创建软链接（--dry-run 仅预览）
- [x] 2.9 实现 `printSummary()` — 使用 picocolors 输出结果摘要表格

## 3. 集成与验证

- [x] 3.1 在 `package.json` scripts 中添加 `link-skills` 和 `postinstall` 入口
- [x] 3.2 运行 `node scripts/link-skills.mjs --agent opencode --dry-run` 验证预览模式
- [x] 3.3 运行 `node scripts/link-skills.mjs --agent opencode` 验证实际链接创建
- [x] 3.4 验证冲突检测：手动创建同名目录后运行脚本，确认提示覆盖
- [x] 3.5 验证 `--help` 和互斥参数报错
