import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { RESOURCES } from './constants.js';

/**
 * @returns {import('./constants.js').ResourceEntry & { sourceDir: string }[]}
 */
export function scanResources() {
  const root = getPackageRoot();

  /** @type {(import('./constants.js').ResourceEntry & { sourceDir: string })[]} */
  const available = [];
  for (const r of RESOURCES) {
    let sourceDir = path.resolve(root, r.type + 's', r.category, r.name);
    if (!fs.existsSync(sourceDir)) {
      if (r.type === 'rule') {
        sourceDir = path.resolve(root, r.type + 's', r.category, r.name + '.md');
      }
      if (!fs.existsSync(sourceDir)) {
        console.error(pc.red(`[ERR] Resource source not found: ${r.type}s/${r.category}/${r.name}`));
        continue;
      }
    }
    available.push({ ...r, sourceDir });
  }
  return available;
}

function getPackageRoot() {
  let dir = import.meta.dirname;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Cannot find package root (no package.json found in ancestor directories)');
}
