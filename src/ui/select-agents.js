import pc from 'picocolors';
import { AGENTS } from '../agents/constants.js';

/**
 * @param {string[]} agentKeys
 * @param {boolean} autoYes
 * @returns {Promise<string[]>}
 */
export async function selectAgents(agentKeys, autoYes) {
  if (autoYes) {
    return agentKeys;
  }

  const { intro, outro, multiselect, isCancel } = await import('@clack/prompts');

  intro(pc.bold(pc.cyan('Select target AI agents')));

  const options = agentKeys.map((key) => ({
    label: AGENTS[key].label,
    value: key,
    hint: AGENTS[key].desc,
  }));

  const selected = await multiselect({
    message: 'Select agents to inject resources into (space to toggle, enter to confirm):',
    options,
    required: true,
  });

  if (isCancel(selected)) {
    outro('Cancelled.');
    process.exit(0);
  }

  const keys = /** @type {string[]} */ (selected);

  outro(pc.green(`Selected ${keys.length} agent(s)`));

  return keys;
}
