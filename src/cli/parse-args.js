import pc from 'picocolors';
import { AGENTS } from '../agents/constants.js';

/**
 * @typedef {Object} ParsedArgs
 * @property {string} [agent]
 * @property {boolean} dryRun - 纯运行标志
 * @property {boolean} yes
 * @property {boolean} help - 帮助
 */

/** 程序参数标志 */
const ARGS = {
  /** agent 参数标志 */
  AGENTS: ['--agent', '-a'],
  /** 纯运行参数标志 */
  DRY_RUN: ['--dry-run'],
  /** 确认标志 */
  YES: ['--yes', '-y'],
  /** 帮助信息标志 */
  HELP: ['--help', '-h']
}


/** 
 * 解析程序参数
 * @returns {ParsedArgs}
 */
export function parseArgs() {
  const argv = process.argv.slice(2);
  /** @type {ParsedArgs} */
  const args = { dryRun: false, yes: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (ARGS.AGENTS.includes(arg)) {
      args.agent = argv[++i];
    } else if (ARGS.DRY_RUN.includes(arg)) {
      args.dryRun = true;
    } else if (ARGS.YES.includes(arg)) {
      args.yes = true;
    } else if (ARGS.HELP.includes(arg)) {
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
  -y, --yes            Skip all confirmation prompts
  -h, --help           Show this help message

${pc.bold('Supported agents:')}
${Object.entries(AGENTS)
    .map(([key, val]) => `  ${pc.cyan(key.padEnd(10))} ${val.label.padEnd(18)} → ${val.dir}`)
    .join('\n')}
`);
}
