import test from 'node:test'
import assert from 'node:assert/strict'
import { groundClaims } from '../src/research/grounding.js'
import { analysisBundle } from '../src/research/result-adapter.js'
import { normalizeBundle, exportProject, parseBackup, evidenceKeys } from '../src/research/model.js'

test('all four categories can recover missing citations without regenerating conclusions', async () => {
  const sources = [{ sourceId: 'M1', paragraphs: [{ id: 'M1-P1', text: '我每周整理两次纪要，必须先核对，再由我发送。' }] }]
  const claims = ['themes', 'painPoints', 'personas', 'insights'].map(category => ({ id: `${category}-1`, text: `${category} 原有结论`, citations: [] }))
  const input = { sources, claims }
  const grounded = await groundClaims(input, async (_prompt, body) => ({ links: JSON.parse(body).claims.map(c => ({ targetId: c.id, evidenceRefs: [{ sourceId: 'M1', paragraphId: 'M1-P1', quote: '必须先核对，再由我发送。' }] })) }))
  assert.deepEqual(grounded.claims.map(c => c.text), claims.map(c => c.text))
  assert(grounded.claims.every(c => c.citations.length === 1))
  assert(claims.every(c => c.citations.length === 0))
  const restored = parseBackup(exportProject(normalizeBundle(grounded, {})))
  assert(grounded.claims.every(c => evidenceKeys(restored, c.id).length === 1))
})

test('source grounding rejects invented quotes and wrong paragraph ids', async () => {
  const input = { sources: [{ sourceId: 'M1', paragraphs: [{ id: 'M1-P1', text: '我不希望自动发送。' }] }], claims: [{ id: 'insights-1', text: '自动发送', citations: [] }] }
  const grounded = await groundClaims(input, async () => ({ links: [{ targetId: 'insights-1', evidenceRefs: [{ sourceId: 'M1', paragraphId: 'M1-P1', quote: '我希望自动发送。' }, { sourceId: 'M1', paragraphId: 'M1-P9', quote: '我不希望自动发送。' }] }] }))
  assert.deepEqual(grounded.claims[0].citations, [])
})

test('already linked results and locally recoverable quotes need no model request', async () => {
  const input = analysisBundle({ themes: [{ title: '核对', summary: '核对', evidence: '先核对再发送。' }] }, [{ content: '先核对\n再发送。' }])
  await groundClaims(input, async () => { throw new Error('Must not call model') })
  input.claims[0].citations = []
  const repaired = await groundClaims(input, async () => { throw new Error('Must not call model') })
  assert.equal(repaired.claims[0].citations.length, 1)
})

test('missing citations are processed in bounded batches and malformed responses fail clearly', async () => {
  const input = { sources: [], claims: Array.from({ length: 9 }, (_, i) => ({ id: `themes-${i}`, text: '结论', citations: [] })) }
  const sizes = []
  await groundClaims(input, async (_prompt, body) => { sizes.push(JSON.parse(body).claims.length); return { links: [] } })
  assert.deepEqual(sizes, [4, 4, 1])
  await assert.rejects(groundClaims(input, async () => ({})), /定位结果格式不完整/)
})
