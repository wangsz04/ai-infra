/**
 * @typedef {Object} AgentPreset
 * @property {string} label - 显示的标签
 * @property {string} dir - 默认注入目录（向后兼容）
 * @property {Record<string, string>} [dirs] - 按资源类型指定注入目录，未配置的类型回退到 dir
 * @property {string} desc - 描述
 */

/** 
 * @typedef { "opencode" | "claude" } AgentKey
 */


/** @type {readonly AgentKey[]} */
export const SUPPORTED_AGENTS = ['opencode', 'claude']

/**
 * @type {Record<AgentKey, AgentPreset>}
 */
export const AGENTS = {
  opencode: {
    label: 'OpenCode',
    dir: '.opencode/skills',
    dirs: { skill: '.opencode/skills', rule: './' },
    desc: 'OpenCode AI coding agent',
  },
  claude: {
    label: 'Claude Code',
    dir: '.claude',
    dirs: { skill: '.claude/skills', rule: '.claude/rules' },
    desc: 'Anthropic Claude Code',
  }
};
