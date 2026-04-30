/**
 * @typedef {Object} AgentPreset
 * @property {string} label
 * @property {string} dir - 默认注入目录（向后兼容）
 * @property {Object<string, string>} [dirs] - 按资源类型指定注入目录，未配置的类型回退到 dir
 * @property {string} desc
 */

/**
 * @type {Object<string, AgentPreset>}
 */
export const AGENTS = {
  opencode: {
    label: 'OpenCode',
    dir: '.opencode/skills',
    dirs: { skill: '.opencode/skills', rule: './' },
    desc: 'OpenCode AI coding agent',
  },
  // codex: {
  //   label: 'Codex',
  //   dir: '.codex',
  //   dirs: { skill: '.codex', rule: '.codex' },
  //   desc: 'OpenAI Codex CLI',
  // },
  // claude: {
  //   label: 'Claude Code',
  //   dir: '.claude',
  //   dirs: { skill: '.claude', rule: '.claude' },
  //   desc: 'Anthropic Claude Code',
  // },
  // copilot: {
  //   label: 'Copilot CLI',
  //   dir: '.github/copilot-instructions.d',
  //   dirs: { skill: '.github/copilot-instructions.d', rule: '.github/copilot-instructions.d' },
  //   desc: 'GitHub Copilot CLI',
  // },
  // cursor: {
  //   label: 'Cursor',
  //   dir: '.cursor/rules',
  //   dirs: { skill: '.cursor/rules', rule: '.cursor/rules' },
  //   desc: 'Cursor editor rules',
  // },
};
