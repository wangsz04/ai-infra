/**
 * @typedef {Object} AgentPreset
 * @property {string} label
 * @property {string} dir
 * @property {string} desc
 */

/**
 * @type {Object<string, AgentPreset>}
 */
export const AGENTS = {
  opencode: {
    label: 'OpenCode',
    dir: '.opencode/skills',
    desc: 'OpenCode AI coding agent',
  },
  codex: {
    label: 'Codex',
    dir: '.codex',
    desc: 'OpenAI Codex CLI',
  },
  claude: {
    label: 'Claude Code',
    dir: '.claude',
    desc: 'Anthropic Claude Code',
  },
  copilot: {
    label: 'Copilot CLI',
    dir: '.github/copilot-instructions.d',
    desc: 'GitHub Copilot CLI',
  },
  cursor: {
    label: 'Cursor',
    dir: '.cursor/rules',
    desc: 'Cursor editor rules',
  },
};
