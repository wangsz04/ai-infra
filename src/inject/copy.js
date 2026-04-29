/**
 * Injection engine — copies resource files from package to target agent directory.
 */
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'

/**
 * @typedef {Object} InjectionItem
 * @property {string} type - 'skill' | 'rule'
 * @property {string} category
 * @property {string} name
 * @property {string} sourceDir - absolute path to source directory
 * @property {string} targetPath - absolute path in user's target dir
 */

/**
 * @typedef {Object} CopyResult
 * @property {string} name
 * @property {'created'|'overwritten'|'skipped'|'error'} status
 * @property {string} [error]
 */

/**
 * Copy resource files to target directories.
 * @param {InjectionItem[]} items
 * @param {{ dryRun: boolean, yes: boolean, targetDir: string }} options
 * @returns {CopyResult[]}
 */
export function copyFiles(items, { dryRun, yes, targetDir }) {
  /** @type {CopyResult[]} */
  const results = []
  for (const item of items) {
    const exists = fs.existsSync(item.targetPath)
    if (exists && !yes) {
      if (dryRun) {
        console.log(pc.cyan(`[DRY-RUN] would overwrite: ${item.name}`))
        results.push({ name: item.name, status: 'overwritten' })
      } else {
        results.push({ name: item.name, status: 'skipped' })
      }
      continue
    }
    if (dryRun) {
      const action = exists ? 'would overwrite' : 'would create'
      console.log(pc.cyan(`[DRY-RUN] ${action}: ${item.name}`))
      results.push({ name: item.name, status: exists ? 'overwritten' : 'created' })
      continue
    }
    try {
      if (exists) {
        fs.rmSync(item.targetPath, { recursive: true, force: true })
      }
      const parentDir = path.dirname(item.targetPath)
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true })
      }
      fs.cpSync(item.sourceDir, item.targetPath, { recursive: true, force: true })
      results.push({ name: item.name, status: exists ? 'overwritten' : 'created' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ name: item.name, status: 'error', error: msg })
    }
  }
  return results
}
