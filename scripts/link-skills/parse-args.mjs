/**
 * CLI 参数解析与帮助信息
 */
import pc from 'picocolors'
import { AGENTS } from './constants.mjs'

/**
 * 解析后的 CLI 参数
 * @typedef {Object} ParsedArgs
 * @property {string} [agent]  - agent 预设名称
 * @property {string} [target] - 自定义目标路径
 * @property {boolean} dryRun  - 预览模式，不实际执行
 * @property {boolean} yes     - 跳过所有确认提示
 * @property {boolean} help    - 显示帮助信息
 */

/** 解析命令行参数 */
/** @returns {ParsedArgs} */
export function parseArgs() {
  const argv = process.argv.slice(2)
  /** @type {ParsedArgs} */
  const args = { dryRun: false, yes: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--agent' || arg === '-a') {
      args.agent = argv[++i]
    } else if (arg === '--target' || arg === '-t') {
      args.target = argv[++i]
    } else if (arg === '--dry-run') {
      args.dryRun = true
    } else if (arg === '--yes') {
      args.yes = true
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    }
  }
  return args
}

/** 打印帮助信息 */
export function printHelp() {
  console.log(`
${pc.bold('link-skills')} - Link skills to AI agent config directories

${pc.bold('Usage:')}
  node scripts/link-skills --agent <name>
  node scripts/link-skills --target <path>

${pc.bold('Options:')}
  -a, --agent <name>   Use a predefined agent preset
  -t, --target <path>  Use a custom target directory
  --dry-run            Preview changes without executing
  --yes                Skip all confirmation prompts
  -h, --help           Show this help message

${pc.bold('Available agents:')}
${Object.entries(AGENTS)
    .map(([key, val]) => `  ${pc.cyan(key.padEnd(10))} ${val.label.padEnd(18)} → ${val.dir}`)
    .join('\n')}
`)
}
