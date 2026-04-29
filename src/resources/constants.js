/**
 * @typedef {Object} ResourceEntry
 * @property {string} type
 * @property {string} category
 * @property {string} name
 */

/** @type {ResourceEntry[]} */
export const RESOURCES = [
  { type: 'skill', category: 'agent', name: 'skill-create' },
  { type: 'skill', category: 'agent', name: 'git-worktree-workflow' },
  { type: 'skill', category: 'fe', name: 'npm-workspace' },
  { type: 'skill', category: 'git', name: 'git-commit' },
  { type: 'rule', category: 'fe', name: 'base' },
];
