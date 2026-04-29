/**
 * 软链接创建
 */
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'

/**
 * 链接结果
 * @typedef {Object} LinkResult
 * @property {string} name
 * @property {'created'|'overwritten'|'skipped'|'error'} status
 * @property {string} [error]
 */

/**
 * 执行软链接创建。dry-run 模式仅输出预览不实际操作。
 * 使用 junction 类型以兼容 Windows。
 * @param {import('./resolve.mjs').ResolvedSkill[]} skills
 * @param {Set<string>} overwrite - 允许覆盖的技能名集合
 * @param {boolean} dryRun
 * @returns {LinkResult[]}
 */
export function createLinks(skills, overwrite, dryRun) {
  /** @type {LinkResult[]} */
  const results = []
  for (const skill of skills) {
    const exists = fs.existsSync(skill.targetLink)
    if (exists && !overwrite.has(skill.name)) {
      results.push({ name: skill.name, status: 'skipped' })
      continue
    }
    if (dryRun) {
      const action = exists ? 'would overwrite' : 'would create'
      console.log(pc.cyan(`[DRY-RUN] ${action} symlink: ${skill.name} → ${skill.sourceDir}`))
      results.push({ name: skill.name, status: exists ? 'overwritten' : 'created' })
      continue
    }
    try {
      if (exists) {
        fs.rmSync(skill.targetLink, { recursive: true, force: true })
      }
      const targetDir = path.dirname(skill.targetLink)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      fs.symlinkSync(skill.sourceDir, skill.targetLink, 'junction')
      results.push({ name: skill.name, status: exists ? 'overwritten' : 'created' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ name: skill.name, status: 'error', error: msg })
    }
  }
  return results
}
