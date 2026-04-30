import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const pkgVersion = pkg.version

function getTagsOnHead() {
  try {
    const result = execSync('git tag --points-at HEAD', {
      cwd: root,
      encoding: 'utf-8',
    }).trim()
    if (!result) return []
    return result.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function validate(tag) {
  const match = tag.match(/^v(\d+\.\d+\.\d.*)$/)
  if (!match) return false
  return match[1] === pkgVersion
}

const tags = getTagsOnHead()

if (tags.length === 0) {
  console.log('当前 HEAD 没有关联的 git tag，跳过版本校验。')
  process.exit(0)
}

const versionTags = tags.filter((t) => /^v\d+\.\d+\.\d/.test(t))
if (versionTags.length === 0) {
  console.log('当前 HEAD 的 tag 不含版本号格式 (v*.*.*)，跳过校验。')
  process.exit(0)
}

let hasError = false
for (const tag of versionTags) {
  if (validate(tag)) {
    console.log(`✓ git tag "${tag}" 与 package.json version "${pkgVersion}" 一致`)
  } else {
    const tagVer = tag.replace(/^v/, '')
    console.error(`✗ 版本不一致: git tag "${tag}" (${tagVer}) ≠ package.json "${pkgVersion}"`)
    hasError = true
  }
}

if (hasError) {
  console.error('\n请使用 npm version 命令更新版本，或手动修改 package.json 后重新打 tag。')
  process.exit(1)
}
