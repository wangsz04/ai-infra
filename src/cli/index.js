#!/usr/bin/env node

import pc from 'picocolors';
import { parseArgs, printHelp } from './parse-args.js';
import { AGENTS } from '../agents/constants.js';
import { scanResources } from '../resources/scan.js';
import { selectAgents } from '../ui/select-agents.js';
import { selectResources } from '../ui/select.js';
import path from 'node:path';

/**
 * @param {import('../agents/constants.js').AgentPreset} agent
 * @returns {Object<string, string>}
 */
function resolveDirs(agent) {
  if (agent.dirs) {
    const result = {};
    for (const [type, dir] of Object.entries(agent.dirs)) {
      result[type] = path.resolve(process.cwd(), dir);
    }
    return result;
  }
  const fallback = path.resolve(process.cwd(), agent.dir);
  return { skill: fallback, rule: fallback };
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    return;
  }

  const autoYes = args.yes || args.dryRun;

  let agentKeys;
  if (args.agent) {
    if (!AGENTS[args.agent]) {
      console.error(pc.red(`Error: Unknown agent "${args.agent}". Available: ${Object.keys(AGENTS).join(', ')}`));
      process.exit(1);
    }
    agentKeys = [args.agent];
  } else {
    agentKeys = await selectAgents(Object.keys(AGENTS), autoYes);
  }

  const availableResources = scanResources();

  if (availableResources.length === 0) {
    console.log(pc.yellow('No resources available. Check RESOURCES constant and bundled files.'));
    return;
  }

  const firstAgent = AGENTS[agentKeys[0]];
  const firstDirs = resolveDirs(firstAgent);
  const items = await selectResources(availableResources, firstAgent.label, firstDirs, autoYes);

  let copyFiles;
  let printSummary;
  try {
    const inject = await import('../inject/copy.js');
    copyFiles = inject.copyFiles;
  } catch {
    console.log(pc.yellow('Injection engine not available (Task 2 not yet merged).'));
  }
  try {
    const summary = await import('../ui/summary.js');
    printSummary = summary.printSummary;
  } catch {
    console.log(pc.yellow('Summary module not available.'));
  }

  let hasError = false;

  for (const agentKey of agentKeys) {
    const agent = AGENTS[agentKey];
    const dirs = resolveDirs(agent);
    const agentItems = items.map((item) => {
      const targetDir = dirs[item.type] || dirs['skill'];
      const baseName = item.type === 'rule' ? item.name + '.md' : item.name;
      return {
        ...item,
        targetPath: path.join(targetDir, baseName),
      };
    });

    if (copyFiles) {
      try {
        const results = copyFiles(agentItems, { dryRun: args.dryRun, yes: args.yes });
        if (printSummary) {
          printSummary(results, agent.label);
        }
        if (results.some((r) => r.status === 'error')) {
          hasError = true;
        }
      } catch (err) {
        console.error(pc.red(`Error injecting into ${agent.label}: ${err.message}`));
        hasError = true;
      }
    } else {
      console.log(pc.gray(`Selected resources for ${agent.label}:`));
      for (const item of agentItems) {
        console.log(pc.gray(`  ${item.type}/${item.category}/${item.name} → ${item.targetPath}`));
      }
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(pc.red(`Fatal: ${err.message}`));
  process.exit(1);
});
