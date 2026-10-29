import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeBundle, entryFor, evidenceKeys, updateEntry, confirmError, gapsFor, exportProject, parseBackup, reportMarkdown, kindFor } from '../src/research/model.js'
const input = JSON.parse(readFileSync(new URL('../src/data/demo-input.json', import.meta.url)))
const review = JSON.parse(readFileSync(new URL('../src/data/demo-review.json', import.meta.url)))
const project = () => normalizeBundle(structuredClone(input), structuredClone(review), '测试研究')

test('import rejects duplicate source IDs and conclusions that differ from the reviewed version', () => {
  const duplicate = structuredClone(input)
  duplicate.sources.push(duplicate.sources[0])
  assert.throws(() => normalizeBundle(duplicate, review), /重复/)
  const changed = structuredClone(input)
  changed.claims[0].text = '被替换的结论'
  assert.throws(() => normalizeBundle(changed, review), /版本不一致/)
})
test('confirmation requires every related paragraph but allows an empty judgment note', () => {
  let p = project()
  const keys = evidenceKeys(p, 'R03')
  assert.ok(keys.length > 1)
  p = updateEntry(p, 'R03', { seen: keys.slice(0, -1), note: '只核对了部分原文' })
  assert.match(confirmError(p, 'R03'), /全部/)
  p = updateEntry(p, 'R03', { seen: keys, note: '' })
  assert.equal(confirmError(p, 'R03'), '')
  const restored = parseBackup(JSON.parse(JSON.stringify(exportProject(updateEntry(p, 'R03', { status: 'confirmed' })))))
  assert.equal(entryFor(restored, 'R03').status, 'confirmed')
  assert.equal(entryFor(restored, 'R03').note, '')
  p = updateEntry(p, 'R03', { note: 'U12 未表态，不能计为支持者。' })
  assert.equal(confirmError(p, 'R03'), '')
})
test('editing a confirmed conclusion or its note invalidates confirmation without losing the original', () => {
  let p = project()
  const original = p.claims.find(c => c.id === 'R09').text
  p = updateEntry(p, 'R09', { seen: evidenceKeys(p, 'R09'), note: '已核对转述关系', status: 'confirmed' })
  const edited = updateEntry(p, 'R09', { text: 'U13 担心系统将试探说法误写为承诺。' }, '保存修订')
  assert.equal(entryFor(edited, 'R09').status, 'edited')
  assert.equal(edited.claims.find(c => c.id === 'R09').text, original)
  assert.equal(entryFor(updateEntry(p, 'R09', { note: '另一个依据' }), 'R09').status, 'pending')
  assert.equal(entryFor(p, 'R09').status, 'confirmed')
})
test('backup round trip preserves drafts, decisions, evidence, scope and history', () => {
  let p = project()
  p = updateEntry(p, 'R09', { text: '修订草稿', draft: '尚未保存的进一步修订', note: '判断依据', seen: evidenceKeys(p, 'R09'), status: 'edited' }, '保存修订')
  const restored = parseBackup(JSON.parse(JSON.stringify(exportProject(p))))
  assert.deepEqual(entryFor(restored, 'R09'), entryFor(p, 'R09'))
  assert.deepEqual(restored.history, p.history)
  assert.deepEqual(restored.review.limitations, p.review.limitations)
  assert.deepEqual(restored.sources, p.sources)
  assert.notEqual(restored.id, p.id)
})
test('missing material blocks confirmation; supplementing it does not automatically approve it', () => {
  let p = project()
  assert.ok(gapsFor(p, 'R12').length)
  assert.match(confirmError(p, 'R12'), /不完整/)
  p = { ...p, sources: [...p.sources, { sourceId: 'M05', participantId: 'U14', paragraphs: [{ id: 'M05-P001', text: 'U14：请自动发给所有人。' }] }] }
  assert.equal(gapsFor(p, 'R12').length, 0)
  assert.equal(entryFor(p, 'R12').status, 'pending')
  assert.equal(kindFor(p, 'R12'), 'unchecked')
  assert.match(confirmError(p, 'R12'), /核对/)
})
test('an unflagged claim still needs a researcher-selected evidence paragraph', () => {
  let p = project()
  assert.match(confirmError(p, 'R02'), /至少一段/)
  p = updateEntry(p, 'R02', { selectedRefs: ['M04|M04-P001'], seen: ['M04|M04-P001'], note: '追访明确说明为同一人，结合其他受访者编号核对。' })
  assert.equal(confirmError(p, 'R02'), '')
})
test('exclusion and restoration retain revisions and reasons', () => {
  let p = project()
  p = updateEntry(p, 'R11', { text: '已修订结论', note: '与原文不符', status: 'excluded' }, '排除结论')
  p = updateEntry(p, 'R11', { status: 'edited' }, '恢复结论')
  assert.equal(entryFor(p, 'R11').note, '与原文不符')
  assert.equal(entryFor(p, 'R11').text, '已修订结论')
  assert.equal(p.history.length, 2)
})
test('report retains evidence location, judgment, original version and exclusion status', () => {
  let p = project()
  p = updateEntry(p, 'R09', { text: '修订内容', note: '系统误写，不是实际承诺。', status: 'excluded' }, '排除结论')
  const report = reportMarkdown(p)
  assert.match(report, /R09 · 已排除/)
  assert.match(report, /M03-P002/)
  assert.ok(report.includes(p.claims.find(c => c.id === 'R09').text))
  assert.match(report, /系统误写，不是实际承诺/)
})
