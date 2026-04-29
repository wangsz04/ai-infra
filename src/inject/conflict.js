/**
 * Conflict detection and interactive resolution for injection operations.
 */
import fs from 'node:fs'
import { createInterface } from 'node:readline'
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
 * @typedef {Object} ConflictInfo
 * @property {InjectionItem} item
 * @property {'directory'|'file'} type
 */

/**
 * Detect existing items at target paths that would conflict with injection.
 * @param {InjectionItem[]} items
 * @returns {ConflictInfo[]}
 */
export function detectConflicts(items) {
  /** @type {ConflictInfo[]} */
  const conflicts = []
  for (const item of items) {
    if (!fs.existsSync(item.targetPath)) {
      continue
    }
    const stat = fs.lstatSync(item.targetPath)
    if (stat.isDirectory()) {
      conflicts.push({ item, type: 'directory' })
    } else {
      conflicts.push({ item, type: 'file' })
    }
  }
  return conflicts
}

/**
 * Prompt user to resolve each conflict interactively.
 * When autoYes is true, auto-confirm overwrite for all conflicts.
 * @param {ConflictInfo[]} conflicts
 * @param {boolean} autoYes
 * @returns {Promise<Set<string>>} names to overwrite
 */
export async function resolveConflicts(conflicts, autoYes) {
  /** @type {Set<string>} */
  const overwrite = new Set()
  for (const conflict of conflicts) {
    if (autoYes) {
      overwrite.add(conflict.item.name)
      console.log(pc.yellow(`[WARN] Overwriting existing ${conflict.type}: ${conflict.item.name}`))
      continue
    }
    const answer = await askQuestion(
      pc.yellow(`[WARN] "${conflict.item.name}" already exists (${conflict.type}). Overwrite? (y/n) `),
    )
    if (answer.toLowerCase() === 'y') {
      overwrite.add(conflict.item.name)
    } else {
      console.log(pc.gray(`  Skipped: ${conflict.item.name}`))
    }
  }
  return overwrite
}

/**
 * Read one line from stdin.
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
