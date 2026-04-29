#!/usr/bin/env node

/**
 * link-skills 入口
 *
 * 将 skills/ 目录下指定的技能通过软链接安装到 AI agent 的配置目录。
 * 支持多 agent 预设（OpenCode、Copilot、Claude Code、Cursor），
 * 也可通过 --target 指定自定义目标路径。
 *
 * 主流程：
 * 1. 解析参数 → 2. 确定目标 → 3. 解析技能 → 4. 检测冲突 → 5. 确认覆盖 → 6. 创建链接 → 7. 输出摘要
 *
 * 用法:
 *   node scripts/link-skills --agent opencode
 *   node scripts/link-skills --target .opencode/skills --dry-run
 */

import pc from 'picocolors'
import { parseArgs, printHelp } from './parse-args.mjs'
import { resolveTarget, resolveSkills } from './resolve.mjs'
import { detectConflicts, resolveConflicts } from './conflict.mjs'
import { createLinks } from './link.mjs'
import { printSummary } from './summary.mjs'

async function main() {
  const args = parseArgs()

  if (args.help) {
    printHelp()
    return
  }

  const { targetDir, agentLabel } = resolveTarget(args)
  const skills = resolveSkills(targetDir)

  if (skills.length === 0) {
    console.log(pc.yellow('No skills to link. Check SKILLS constant.'))
    return
  }

  const conflicts = detectConflicts(skills)
  const overwrite = await resolveConflicts(conflicts, args.yes || args.dryRun)
  const results = createLinks(skills, overwrite, args.dryRun)
  printSummary(results, agentLabel)

  if (results.some((r) => r.status === 'error')) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(pc.red(`Fatal: ${err.message}`))
  process.exit(1)
})
