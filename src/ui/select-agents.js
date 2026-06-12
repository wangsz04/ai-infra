/** @import { AgentKey } from '@/agents/constants.js' */

import pc from 'picocolors';
import { AGENTS } from '../agents/constants.js';
import { intro, outro, multiselect, isCancel } from '@clack/prompts'

/**
 * @param {readonly AgentKey[]} agentKeys
 * @param {boolean} autoYes
 * @returns {Promise<AgentKey[]>}
 */
export async function selectAgents(agentKeys, autoYes) {
  /** @type {AgentKey[]} */
  let ret = []
  if (autoYes) {
    ret = [...agentKeys]
    return ret;
  }

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

  ret = /** @type {AgentKey[]} */ (selected);

  outro(pc.green(`Selected ${ret.length} agent(s)`));

  return ret;
}
