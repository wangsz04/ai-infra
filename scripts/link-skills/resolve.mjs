/**
 * 目标目录与技能列表解析
 */
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { ROOT, AGENTS, SKILLS } from './constants.mjs'

/**
 * 根据 --agent 或 --target 确定目标目录。
 * 两者互斥，同时传入会报错退出。
 * @param {import('./parse-args.mjs').ParsedArgs} args
 * @returns {{ targetDir: string, agentLabel: string }}
 */
export function resolveTarget(args) {
  if (args.agent && args.target) {
    console.error(pc.red('Error: --agent and --target are mutually exclusive'))
    process.exit(1)
  }
  if (args.agent) {
    const preset = AGENTS[args.agent]
    if (!preset) {
      console.error(pc.red(`Error: Unknown agent "${args.agent}". Available: ${Object.keys(AGENTS).join(', ')}`))
      process.exit(1)
    }
    if (preset.strategy === 'manual') {
      console.error(
        pc.yellow(`Warning: Agent "${args.agent}" uses "${preset.strategy}" strategy and may need manual adaptation`),
      )
    }
    return { targetDir: path.resolve(ROOT, preset.dir), agentLabel: preset.label }
  }
  if (args.target) {
    return { targetDir: path.resolve(ROOT, args.target), agentLabel: args.target }
  }
  console.error(pc.red('Error: Must specify --agent <name> or --target <path>'))
  process.exit(1)
}

/**
 * 已解析的技能信息，包含源目录和目标链接路径
 * @typedef {Object} ResolvedSkill
 * @property {string} category   - 分类名
 * @property {string} name       - 技能名
 * @property {string} sourceDir  - 源目录绝对路径
 * @property {string} targetLink - 目标链接绝对路径
 */

/**
 * 从 SKILLS 常量解析技能列表，校验源目录是否存在。
 * 不存在的技能会报错跳过。
 * @param {string} targetDir - 目标目录绝对路径
 * @returns {ResolvedSkill[]}
 */
export function resolveSkills(targetDir) {
  /** @type {ResolvedSkill[]} */
  const resolved = []
  for (const skill of SKILLS) {
    const sourceDir = path.resolve(ROOT, 'skills', skill.category, skill.name)
    if (!fs.existsSync(sourceDir)) {
      console.error(pc.red(`[ERR] Skill source not found: skills/${skill.category}/${skill.name}`))
      continue
    }
    resolved.push({
      category: skill.category,
      name: skill.name,
      sourceDir,
      targetLink: path.resolve(targetDir, skill.name),
    })
  }
  return resolved
}
