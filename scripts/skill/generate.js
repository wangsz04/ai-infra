#!/usr/bin/env node

/**
 * @fileoverview Skill 生成脚本
 * 使用 EJS 模板在指定位置生成 skill 目录结构
 *
 * @module scripts/skill/generate
 * @requires ejs
 * @requires fs
 * @requires path
 *
 * @example
 * // 基本用法（通过 --content-file 传入 skill-creator 生成的正文文件）
 * node scripts/skill/generate.js --name my-skill --description "我的技能描述" --output ./skills/agent --content-file ./tmp/skill-body.md
 *
 * @example
 * // 带可选参数（通过 --content 传入内联正文）
 * node scripts/skill/generate.js \
 *   --name my-skill \
 *   --description "我的技能描述" \
 *   --output ./skills/agent \
 *   --content "# my-skill\n\n## 功能概述\n\n..." \
 *   --license MIT \
 *   --author wangsz \
 *   --version 1.0.0 \
 *   --examples \
 *   --references
 */

'use strict';

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

/** 项目根目录 */
const ROOT_DIR = path.resolve(__dirname, '../../');

/** SKILL.md EJS 模板路径 */
const SKILL_TEMPLATE_PATH = path.join(ROOT_DIR, 'templates/skills/skill.ejs');

/**
 * @typedef {Object} SkillMetadata
 * @property {string} [version] - skill 版本号
 * @property {string} [author]  - skill 作者
 */

/**
 * @typedef {Object} GenerateOptions
 * @property {string}        name         - skill 名称（kebab-case）
 * @property {string}        description  - skill 描述（不超过150字）
 * @property {string}        output       - 输出目录路径（skill 目录将创建于此路径下）
 * @property {string}        skillContent - SKILL.md 正文（Markdown），由 skill-creator 生成后传入，必填
 * @property {string}        [license]    - 许可证类型，例如 "MIT"
 * @property {SkillMetadata} [metadata]   - 额外元数据
 * @property {boolean}       [examples]   - 是否创建 examples/ 子目录
 * @property {boolean}       [references] - 是否创建 references/ 子目录
 * @property {boolean}       [assets]     - 是否创建 assets/ 子目录
 */

/**
 * 验证 skill 名称是否符合规范（kebab-case，仅小写字母、数字和连字符）
 *
 * @param {string} name - 待验证的 skill 名称
 * @returns {boolean} 名称合法返回 true，否则返回 false
 */
function isValidSkillName(name) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/**
 * 解析命令行参数，返回键值对对象
 *
 * @param {string[]} argv - process.argv 切片后的参数数组
 * @returns {Record<string, string | boolean>} 解析结果
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

/**
 * 确保目录存在，若不存在则递归创建
 *
 * @param {string} dirPath - 目录路径
 * @returns {void}
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 使用 EJS 模板渲染并生成 SKILL.md 文件内容
 *
 * 模板变量：
 * - `name`         skill 名称
 * - `description`  skill 描述
 * - `license`      许可证（可选）
 * - `metadata`     元数据键值对（可选）
 * - `skillContent` SKILL.md 正文（由 skill-creator 生成的 Markdown 字符串，必填）
 *
 * @param {GenerateOptions} options - 生成选项
 * @returns {Promise<string>} 渲染后的 SKILL.md 文本内容
 * @throws {Error} skillContent 为空时抛出，提示通过 skill-creator 生成内容
 */
async function renderSkillTemplate(options) {
  if (!options.skillContent) {
    throw new Error(
      'skillContent 不能为空，请使用 skill-creator 规则生成正文内容后通过 --content 或 --content-file 传入'
    );
  }
  const templateStr = fs.readFileSync(SKILL_TEMPLATE_PATH, 'utf-8');
  return ejs.render(templateStr, {
    name: options.name,
    description: options.description,
    license: options.license || '',
    metadata: options.metadata || {},
    skillContent: options.skillContent,
  });
}

/**
 * 在指定输出目录下生成完整的 skill 目录结构
 *
 * 目录结构：
 * ```
 * <output>/<name>/
 * ├── SKILL.md
 * ├── examples/     （可选）
 * ├── references/   （可选）
 * └── assets/       （可选）
 * ```
 *
 * @param {GenerateOptions} options - 生成选项
 * @returns {Promise<void>}
 */
async function generateSkill(options) {
  const { name, output, examples, references, assets } = options;

  // 目标 skill 根目录
  const skillDir = path.resolve(output, name);

  // 校验 skill 名称
  if (!isValidSkillName(name)) {
    throw new Error(
      `skill 名称不合法："${name}"，必须使用 kebab-case（小写字母、数字和连字符）`
    );
  }

  // 校验描述长度
  if (options.description.length > 150) {
    console.warn(`[warn] description 超过 150 字（当前 ${options.description.length} 字），建议精简`);
  }

  // 创建 skill 根目录
  ensureDir(skillDir);
  console.log(`[create] ${skillDir}`);

  // 渲染并写入 SKILL.md
  const skillContent = await renderSkillTemplate(options);
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  fs.writeFileSync(skillMdPath, skillContent, 'utf-8');
  console.log(`[create] ${skillMdPath}`);

  // 可选子目录
  if (examples) {
    ensureDir(path.join(skillDir, 'examples'));
    console.log(`[create] ${path.join(skillDir, 'examples')}/`);
  }
  if (references) {
    ensureDir(path.join(skillDir, 'references'));
    console.log(`[create] ${path.join(skillDir, 'references')}/`);
  }
  if (assets) {
    ensureDir(path.join(skillDir, 'assets'));
    console.log(`[create] ${path.join(skillDir, 'assets')}/`);
  }

  console.log(`\nskill "${name}" 生成成功 -> ${skillDir}`);
}

/**
 * 打印帮助信息
 *
 * @returns {void}
 */
function printHelp() {
  console.log(`
用法：
  node scripts/skill/generate.js [选项]

必填选项：
  --name          <string>   skill 名称（kebab-case）
  --description   <string>   skill 描述（不超过150字）
  --output        <string>   输出目录路径
  --content       <string>   SKILL.md 正文（内联 Markdown，与 --content-file 二选一）
  --content-file  <path>     SKILL.md 正文文件路径（与 --content 二选一）

  注：正文内容应由 skill-creator 规则生成后传入。

可选选项：
  --license     <string>   许可证类型（如 MIT）
  --author      <string>   作者名称（写入 metadata）
  --version     <string>   版本号（写入 metadata）
  --examples               创建 examples/ 子目录
  --references             创建 references/ 子目录
  --assets                 创建 assets/ 子目录
  --help                   显示帮助信息

示例：
  node scripts/skill/generate.js \\
    --name my-skill \\
    --description "实现某某功能的技能" \\
    --output ./skills/agent \\
    --content-file ./tmp/skill-body.md \\
    --author wangsz \\
    --version 1.0.0 \\
    --examples \\
    --references
`);
}

/**
 * 脚本入口：解析 CLI 参数并执行 skill 生成
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // 必填参数校验
  const missing = ['name', 'description', 'output'].filter((k) => !args[k]);
  if (missing.length > 0) {
    console.error(`[error] 缺少必填参数：${missing.map((k) => `--${k}`).join(', ')}`);
    printHelp();
    process.exit(1);
  }

  // skillContent 来源：--content-file 优先，其次 --content，两者均缺失则报错
  let skillContent;
  if (args['content-file']) {
    const contentFilePath = path.resolve(String(args['content-file']));
    if (!fs.existsSync(contentFilePath)) {
      console.error(`[error] --content-file 指定的文件不存在：${contentFilePath}`);
      process.exit(1);
    }
    skillContent = fs.readFileSync(contentFilePath, 'utf-8');
  } else if (args.content) {
    skillContent = String(args.content);
  } else {
    console.error(
      '[error] 缺少必填参数：--content 或 --content-file\n' +
      '        请使用 skill-creator 规则生成正文内容后传入'
    );
    printHelp();
    process.exit(1);
  }

  /** @type {SkillMetadata} */
  const metadata = {};
  if (args.version) metadata.version = String(args.version);
  if (args.author) metadata.author = String(args.author);

  /** @type {GenerateOptions} */
  const options = {
    name: String(args.name),
    description: String(args.description),
    output: String(args.output),
    skillContent,
    license: args.license ? String(args.license) : undefined,
    metadata,
    examples: Boolean(args.examples),
    references: Boolean(args.references),
    assets: Boolean(args.assets),
  };

  try {
    await generateSkill(options);
  } catch (err) {
    console.error(`[error] ${err.message}`);
    process.exit(1);
  }
}

main();
