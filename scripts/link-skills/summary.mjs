/**
 * 结果摘要输出
 */
import pc from 'picocolors'

/**
 * 输出链接结果摘要表格
 * @param {import('./link.mjs').LinkResult[]} results
 * @param {string} agentLabel
 */
export function printSummary(results, agentLabel) {
  const created = results.filter((r) => r.status === 'created')
  const overwritten = results.filter((r) => r.status === 'overwritten')
  const skipped = results.filter((r) => r.status === 'skipped')
  const errors = results.filter((r) => r.status === 'error')

  console.log()
  console.log(pc.bold(pc.cyan(`◉ Link Skills → ${agentLabel}`)))
  console.log(pc.gray('─'.repeat(50)))

  for (const r of results) {
    if (r.status === 'created') {
      console.log(pc.green(`  ✓  ${r.name}`))
    } else if (r.status === 'overwritten') {
      console.log(pc.yellow(`  ⚠  ${r.name}  (overwritten)`))
    } else if (r.status === 'skipped') {
      console.log(pc.gray(`  -  ${r.name}  (skipped)`))
    } else if (r.status === 'error') {
      console.log(pc.red(`  ✗  ${r.name}  (${r.error})`))
    }
  }

  console.log(pc.gray('─'.repeat(50)))
  const parts = []
  if (created.length) parts.push(pc.green(`${created.length} created`))
  if (overwritten.length) parts.push(pc.yellow(`${overwritten.length} overwritten`))
  if (skipped.length) parts.push(pc.gray(`${skipped.length} skipped`))
  if (errors.length) parts.push(pc.red(`${errors.length} errors`))
  console.log(`  ${parts.join('  ')}`)
  console.log()
}
