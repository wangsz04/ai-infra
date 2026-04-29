/**
 * 冲突检测与用户确认
 */
import fs from 'node:fs'
import { createInterface } from 'node:readline'
import pc from 'picocolors'

/**
 * 冲突类型
 * @typedef {'none'|'symlink'|'directory'|'file'} ConflictType
 */

/**
 * 冲突信息
 * @typedef {Object} ConflictInfo
 * @property {import('./resolve.mjs').ResolvedSkill} skill
 * @property {ConflictType} type
 */

/**
 * 检测目标路径中已存在的同名条目（软链接、目录或文件）。
 * @param {import('./resolve.mjs').ResolvedSkill[]} skills
 * @returns {ConflictInfo[]}
 */
export function detectConflicts(skills) {
  /** @type {ConflictInfo[]} */
  const conflicts = []
  for (const skill of skills) {
    if (!fs.existsSync(skill.targetLink)) {
      continue
    }
    const stat = fs.lstatSync(skill.targetLink)
    if (stat.isSymbolicLink()) {
      conflicts.push({ skill, type: 'symlink' })
    } else if (stat.isDirectory()) {
      conflicts.push({ skill, type: 'directory' })
    } else {
      conflicts.push({ skill, type: 'file' })
    }
  }
  return conflicts
}

/**
 * 逐项处理冲突，确认是否覆盖。
 * autoYes 为 true 时（--yes 或 --dry-run）自动确认覆盖。
 * @param {ConflictInfo[]} conflicts
 * @param {boolean} autoYes
 * @returns {Promise<Set<string>>} 需要覆盖的技能名集合
 */
export async function resolveConflicts(conflicts, autoYes) {
  /** @type {Set<string>} */
  const overwrite = new Set()
  for (const conflict of conflicts) {
    if (autoYes) {
      overwrite.add(conflict.skill.name)
      console.log(pc.yellow(`[WARN] Overwriting existing ${conflict.type}: ${conflict.skill.name}`))
      continue
    }
    const typeLabel = conflict.type === 'symlink' ? 'symlink' : conflict.type === 'directory' ? 'directory' : 'file'
    const answer = await askQuestion(
      pc.yellow(`[WARN] "${conflict.skill.name}" already exists (${typeLabel}). Overwrite? (y/n) `),
    )
    if (answer.toLowerCase() === 'y') {
      overwrite.add(conflict.skill.name)
    } else {
      console.log(pc.gray(`  Skipped: ${conflict.skill.name}`))
    }
  }
  return overwrite
}

/**
 * 从 stdin 读取一行用户输入
 * @param {string} question
 * @returns {Promise<string>}
 */
function askQuestion(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}
