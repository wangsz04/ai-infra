#!/usr/bin/env node

import pc from 'picocolors';
import { parseArgs, printHelp } from './parse-args.js';
import { detectAgents } from '../agents/detect.js';
import { AGENTS } from '../agents/constants.js';
import { scanResources } from '../resources/scan.js';
import { selectResources } from '../ui/select.js';
import path from 'node:path';

async function main() {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    return;
  }

  const agentKeys = detectAgents(args.agent);

  if (agentKeys.length === 0) {
    console.log(pc.yellow('No supported AI agent detected in this directory.'));
    console.log(pc.gray('Use --agent <name> to specify one manually:'));
    for (const [key, preset] of Object.entries(AGENTS)) {
      console.log(pc.gray(`  --agent ${key}  → ${preset.dir}`));
    }
    process.exit(0);
  }

  if (agentKeys.length > 1) {
    console.log(pc.yellow('Multiple agents detected. Select one:'));
    agentKeys.forEach((k) => console.log(pc.gray(`  --agent ${k}  → ${AGENTS[k].dir}`)));
    process.exit(0);
  }

  const agentKey = agentKeys[0];
  const agent = AGENTS[agentKey];
  const targetDir = path.resolve(process.cwd(), agent.dir);

  const availableResources = scanResources();

  if (availableResources.length === 0) {
    console.log(pc.yellow('No resources available. Check RESOURCES constant and bundled files.'));
    return;
  }

  const items = await selectResources(availableResources, agent.label, targetDir, args.yes || args.dryRun);

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

  if (copyFiles) {
    const results = copyFiles(items, { dryRun: args.dryRun, yes: args.yes, targetDir });
    if (printSummary) {
      printSummary(results, agent.label);
    }
    if (results.some((r) => r.status === 'error')) {
      process.exit(1);
    }
  } else {
    console.log(pc.gray('Selected resources (injection engine not yet available):'));
    for (const item of items) {
      console.log(pc.gray(`  ${item.type}/${item.category}/${item.name} → ${item.targetPath}`));
    }
  }
}

main().catch((err) => {
  console.error(pc.red(`Fatal: ${err.message}`));
  process.exit(1);
});
