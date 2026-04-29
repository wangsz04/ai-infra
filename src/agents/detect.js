import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { AGENTS } from './constants.js';

/**
 * @param {string} [agentArg]
 * @returns {string[]}
 */
export function detectAgents(agentArg) {
  const cwd = process.cwd();

  if (agentArg) {
    if (!AGENTS[agentArg]) {
      console.error(pc.red(`Error: Unknown agent "${agentArg}". Available: ${Object.keys(AGENTS).join(', ')}`));
      process.exit(1);
    }
    return [agentArg];
  }

  /** @type {string[]} */
  const found = [];
  for (const [key, preset] of Object.entries(AGENTS)) {
    if (fs.existsSync(path.join(cwd, preset.dir))) {
      found.push(key);
    }
  }
  return found;
}
