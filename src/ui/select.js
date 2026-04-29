import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

/**
 * @typedef {import('../resources/constants.js').ResourceEntry & { sourceDir: string }} AvailableResource
 * @typedef {import('../resources/constants.js').ResourceEntry & { sourceDir: string, targetPath: string }} InjectionItem
 */

/**
 * @param {AvailableResource[]} availableResources
 * @param {string} agentLabel
 * @param {string} targetDir
 * @param {boolean} autoYes
 * @returns {Promise<InjectionItem[]>}
 */
export async function selectResources(availableResources, agentLabel, targetDir, autoYes) {
  if (autoYes) {
    return availableResources.map((r) => ({
      type: r.type,
      category: r.category,
      name: r.name,
      sourceDir: r.sourceDir,
      targetPath: path.join(targetDir, r.name),
    }));
  }

  const { intro, outro, multiselect, isCancel } = await import('@clack/prompts');

  intro(pc.bold(pc.cyan(`Configure AI agent resources for ${agentLabel}`)));
  console.log(pc.gray(`  Target: ${targetDir}`));
  console.log();

  const skills = availableResources.filter((r) => r.type === 'skill');
  const rules = availableResources.filter((r) => r.type === 'rule');

  const options = [];

  if (skills.length > 0) {
    options.push({ label: pc.bold('Skills'), value: '__skills_header__', hint: '─'.repeat(20) });
    for (const s of skills) {
      const targetPath = path.join(targetDir, s.name);
      const exists = fs.existsSync(targetPath);
      const hint = exists ? pc.yellow(' (exists)') : '';
      options.push({
        label: `  ${s.category}/${s.name}`,
        value: JSON.stringify({ type: s.type, category: s.category, name: s.name }),
        hint,
      });
    }
  }

  if (rules.length > 0) {
    options.push({ label: pc.bold('Rules'), value: '__rules_header__', hint: '─'.repeat(20) });
    for (const r of rules) {
      const targetPath = path.join(targetDir, r.name);
      const exists = fs.existsSync(targetPath) || fs.existsSync(targetPath + '.md');
      const hint = exists ? pc.yellow(' (exists)') : '';
      options.push({
        label: `  ${r.category}/${r.name}`,
        value: JSON.stringify({ type: r.type, category: r.category, name: r.name }),
        hint,
      });
    }
  }

  const selected = await multiselect({
    message: 'Select resources to inject (space to toggle, enter to confirm):',
    options,
    required: false,
  });

  if (isCancel(selected)) {
    outro('Cancelled.');
    process.exit(0);
  }

  const items = (selected || [])
    .filter((v) => typeof v === 'string' && !v.startsWith('__') && !v.endsWith('__'))
    .map((v) => {
      const parsed = JSON.parse(v);
      const source = availableResources.find(
        (r) => r.type === parsed.type && r.category === parsed.category && r.name === parsed.name,
      );
      const targetPath = path.join(targetDir, parsed.name);
      return {
        type: parsed.type,
        category: parsed.category,
        name: parsed.name,
        sourceDir: source.sourceDir,
        targetPath,
      };
    });

  outro(pc.green(`Selected ${items.length} resource(s) for ${agentLabel}`));

  if (items.length === 0) {
    console.log(pc.yellow('No resources selected. Exiting.'));
    process.exit(0);
  }

  return items;
}
