import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

/**
 * @typedef {import('../resources/constants.js').ResourceEntry & { sourceDir: string }} AvailableResource
 * @typedef {import('../resources/constants.js').ResourceEntry & { sourceDir: string, targetPath: string }} InjectionItem
 */

/**
 * @param {AvailableResource} resource
 * @param {Object<string, string>} dirs - { type: targetDir }
 * @returns {string}
 */
function resolveTargetPath(resource, dirs) {
  const targetDir = dirs[resource.type] || dirs['skill'] || Object.values(dirs)[0];
  const base = resource.type === 'rule' ? resource.name + '.md' : resource.name;
  return path.join(targetDir, base);
}

/**
 * @param {AvailableResource[]} resources
 * @returns {string[]}
 */
function getUniqueTypes(resources) {
  return [...new Set(resources.map((r) => r.type))];
}

/**
 * @param {AvailableResource[]} resources
 * @param {string} type
 * @returns {string[]}
 */
function getCategoriesByType(resources, type) {
  const filtered = resources.filter((r) => r.type === type);
  return [...new Set(filtered.map((r) => r.category))];
}

/**
 * @param {AvailableResource[]} resources
 * @param {string[]} types
 * @param {string[]} categories
 * @returns {AvailableResource[]}
 */
function filterResources(resources, types, categories) {
  return resources.filter((r) => types.includes(r.type) && categories.includes(r.type + '/' + r.category));
}

/**
 * @param {AvailableResource[]} availableResources
 * @param {string} agentLabel
 * @param {Object<string, string>} dirs - 按资源类型的目标目录映射，如 { skill: '.opencode/skills', rule: '.opencode/rules' }
 * @param {boolean} autoYes
 * @returns {Promise<InjectionItem[]>}
 */
export async function selectResources(availableResources, agentLabel, dirs, autoYes) {
  if (autoYes) {
    return availableResources.map((r) => ({
      type: r.type,
      category: r.category,
      name: r.name,
      sourceDir: r.sourceDir,
      targetPath: resolveTargetPath(r, dirs),
    }));
  }

  const { intro, outro, multiselect, isCancel } = await import('@clack/prompts');

  const dirList = Object.entries(dirs).map(([type, dir]) => `${type}: ${dir}`).join(', ');
  intro(pc.bold(pc.cyan(`Configure AI agent resources for ${agentLabel}`)));
  console.log(pc.gray(`  Target: ${dirList}`));
  console.log();

  const allTypes = getUniqueTypes(availableResources);

  let selectedTypes;
  if (allTypes.length === 1) {
    selectedTypes = allTypes;
  } else {
    const typeOptions = allTypes.map((t) => ({
      label: t.charAt(0).toUpperCase() + t.slice(1) + 's',
      value: t,
    }));
    const typeResult = await multiselect({
      message: 'Select resource types:',
      options: typeOptions,
      required: true,
    });
    if (isCancel(typeResult)) {
      outro('Cancelled.');
      process.exit(0);
    }
    selectedTypes = /** @type {string[]} */ (typeResult);
  }

  const allCategories = [];
  for (const type of selectedTypes) {
    const cats = getCategoriesByType(availableResources, type);
    for (const cat of cats) {
      allCategories.push({ type, category: cat, key: type + '/' + cat });
    }
  }

  let selectedCategoryKeys;
  if (allCategories.length === 1) {
    selectedCategoryKeys = allCategories.map((c) => c.key);
  } else {
    const categoryOptions = [];
    for (const type of selectedTypes) {
      const cats = allCategories.filter((c) => c.type === type);
      if (cats.length === 0) continue;
      categoryOptions.push({
        label: pc.bold(type.charAt(0).toUpperCase() + type.slice(1) + 's'),
        value: '__' + type + '_header__',
        hint: '─'.repeat(20),
      });
      for (const c of cats) {
        categoryOptions.push({
          label: '  ' + c.category,
          value: c.key,
        });
      }
    }
    const categoryResult = await multiselect({
      message: 'Select categories:',
      options: categoryOptions,
      required: true,
    });
    if (isCancel(categoryResult)) {
      outro('Cancelled.');
      process.exit(0);
    }
    selectedCategoryKeys = (/** @type {string[]} */ (categoryResult)).filter(
      (v) => typeof v === 'string' && !v.startsWith('__') && !v.endsWith('__'),
    );
  }

  const filtered = filterResources(availableResources, selectedTypes, selectedCategoryKeys);

  if (filtered.length === 0) {
    console.log(pc.yellow('No resources match the selected filters. Exiting.'));
    process.exit(0);
  }

  const resourceOptions = [];
  for (const type of selectedTypes) {
    const typeResources = filtered.filter((r) => r.type === type);
    if (typeResources.length === 0) continue;
    resourceOptions.push({
      label: pc.bold(type.charAt(0).toUpperCase() + type.slice(1) + 's'),
      value: '__' + type + '_header__',
      hint: '─'.repeat(20),
    });
    for (const r of typeResources) {
      const targetPath = resolveTargetPath(r, dirs);
      const exists = fs.existsSync(targetPath);
      resourceOptions.push({
        label: '  ' + r.category + '/' + r.name,
        value: JSON.stringify({ type: r.type, category: r.category, name: r.name }),
        hint: exists ? pc.yellow('(exists)') : undefined,
      });
    }
  }

  const resourceResult = await multiselect({
    message: 'Select resources to inject (space to toggle, enter to confirm):',
    options: resourceOptions,
    required: false,
  });

  if (isCancel(resourceResult)) {
    outro('Cancelled.');
    process.exit(0);
  }

  const items = (/** @type {string[]} */ (resourceResult) || [])
    .filter((v) => typeof v === 'string' && !v.startsWith('__') && !v.endsWith('__'))
    .map((v) => {
      const parsed = JSON.parse(v);
      const source = availableResources.find(
        (r) => r.type === parsed.type && r.category === parsed.category && r.name === parsed.name,
      );
      if (!source) return null;
      return {
        type: parsed.type,
        category: parsed.category,
        name: parsed.name,
        sourceDir: source.sourceDir,
        targetPath: resolveTargetPath(source, dirs),
      };
    })
    .filter(Boolean);

  outro(pc.green(`Selected ${items.length} resource(s) for ${agentLabel}`));

  if (items.length === 0) {
    console.log(pc.yellow('No resources selected. Exiting.'));
    process.exit(0);
  }

  return items;
}
