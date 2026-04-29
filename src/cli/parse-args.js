import pc from 'picocolors';
import { AGENTS } from '../agents/constants.js';

/**
 * @typedef {Object} ParsedArgs
 * @property {string} [agent]
 * @property {boolean} dryRun
 * @property {boolean} yes
 * @property {boolean} help
 */

/** @returns {ParsedArgs} */
export function parseArgs() {
  const argv = process.argv.slice(2);
  /** @type {ParsedArgs} */
  const args = { dryRun: false, yes: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--agent' || arg === '-a') {
      args.agent = argv[++i];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--yes') {
      args.yes = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
}

export function printHelp() {
  console.log(`
${pc.bold('wangsz-ai')} - Inject AI agent resources into your project

${pc.bold('Usage:')}
  npx wangsz-ai
  wangsz-ai --agent <name>
  wangsz-ai --agent <name> --yes --dry-run

${pc.bold('Options:')}
  -a, --agent <name>   Skip detection and use a specific agent
  --dry-run            Preview changes without executing
  --yes                Skip all confirmation prompts
  -h, --help           Show this help message

${pc.bold('Supported agents:')}
${Object.entries(AGENTS)
    .map(([key, val]) => `  ${pc.cyan(key.padEnd(10))} ${val.label.padEnd(18)} → ${val.dir}`)
    .join('\n')}
`);
}
