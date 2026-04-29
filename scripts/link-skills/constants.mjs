/**
 * 常量定义：agent 预设、技能清单、项目路径
 */
import path from 'node:path';

/** 项目根目录 */
export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * 链接策略
 * @typedef {'flatten'|'manual'} Strategy
 * - flatten: skills/<cat>/<name> → <target>/<name>（去掉分类层）
 * - manual:  需要手动适配，脚本仅输出提示
 */

/**
 * Agent 预设配置
 * @typedef {Object} AgentPreset
 * @property {string} label      - 显示名称
 * @property {string} dir        - 目标目录（相对项目根）
 * @property {Strategy} strategy - 路径映射策略
 * @property {string} [desc]     - 描述说明
 */

/**
 * 预定义的 agent 配置。新增 agent 只需在此添加条目。
 * @type {Object<string, AgentPreset>}
 */
export const AGENTS = {
  opencode: {
    label: 'OpenCode',
    dir: '.opencode/skills',
    strategy: 'flatten',
    desc: 'OpenCode AI coding agent',
  },
  // codex: {
  //   label: 'GitHub Copilot',
  //   dir: '.github/copilot-instructions.d',
  //   strategy: 'manual',
  //   desc: 'Copilot instructions mode',
  // },
  // claude: {
  //   label: 'Claude Code',
  //   dir: '.claude',
  //   strategy: 'manual',
  //   desc: 'Claude Code config',
  // },
  // cursor: {
  //   label: 'Cursor',
  //   dir: '.cursor/rules',
  //   strategy: 'manual',
  //   desc: 'Cursor .mdc rules',
  // },
};

/**
 * 技能条目，对应 skills/<category>/<name>/ 目录
 * @typedef {Object} SkillEntry
 * @property {string} category - 分类目录名
 * @property {string} name     - 技能目录名
 */

/**
 * 固定的技能清单。仅链接此处列出的技能，不会扫描全部 skills/ 目录。
 * 新增技能只需在此添加条目。
 * @type {SkillEntry[]}
 */
export const SKILLS = [
  { category: 'agent', name: 'skill-create' },
  { category: 'agent', name: 'git-worktree-workflow' },
];
