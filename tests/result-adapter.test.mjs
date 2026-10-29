import test from 'node:test'
import assert from 'node:assert/strict'
import { analysisBundle } from '../src/research/result-adapter.js'
import { normalizeBundle, evidenceKeys, confirmError } from '../src/research/model.js'
import { handleAnalysis } from '../api-analysis-handler.js'

test('automatic citations tolerate PDF whitespace but preserve the original quote', () => {
  const input = analysisBundle({ themes: [{ title: '通道', summary: '两种通道', evidence: '卡片有OMA和蓝牙两种通道。' }] }, [{ content: '卡片有 OMA 和蓝牙\n两种通道。' }])
  assert.equal(input.claims[0].citations[0].quote, '卡片有 OMA 和蓝牙\n两种通道。')
  const project = normalizeBundle(input, {})
  assert.equal(evidenceKeys(project, 'themes-1').length, 1)
  assert.match(confirmError(project, 'themes-1'), /核对全部/)
})

test('a quote spanning paragraph boundaries links each original paragraph', () => {
  const input = analysisBundle({ insights: [{ title: '核对', description: '先核对再发', nextStep: '', evidence: '先核对原文，再点发送。' }] }, [{ content: '先核对原文，\n\n再点发送。' }])
  assert.deepEqual(input.claims[0].citations.map(r => [r.paragraphId, r.quote]), [['M1-P1', '先核对原文，'], ['M1-P2', '再点发送。']])
})

test('explicit source references disambiguate identical quotations and reject incorrect locations', () => {
  const transcripts = [{ content: '需要核对。' }, { content: '需要核对。' }]
  const item = { title: '核对', summary: '需要核对', evidence: '', evidenceRefs: [{ sourceId: 'M2', paragraphId: 'M2-P1', quote: '需要核对。' }] }
  assert.deepEqual(analysisBundle({ themes: [item] }, transcripts).claims[0].citations.map(r => r.sourceId), ['M2'])
  item.evidenceRefs[0].quote = '不需要核对。'
  assert.deepEqual(analysisBundle({ themes: [item] }, transcripts).claims[0].citations, [])
})

test('automatic linking never treats a paraphrase or an omitted negation as an exact quote', () => {
  const input = analysisBundle({ themes: [{ title: '发送', summary: '发送', evidence: '我希望直接发送。' }] }, [{ content: '我不希望直接发送。' }])
  assert.deepEqual(input.claims[0].citations, [])
})

test('analysis evidence points only to exact paragraphs and keeps a source snapshot', () => {
  const transcripts = [{ name: '访谈一', content: 'U1：愿意试试。\n\nU1：必须先由我核对。' }, { name: '访谈二', content: 'U2：必须先由我核对。' }]
  const result = { themes: [{ title: '核对', summary: '两份材料包含核对要求。', evidence: '必须先由我核对。' }], insights: [{ title: '假引文', description: '自动发送', nextStep: '上线', evidence: '直接发送就好。' }] }
  const input = analysisBundle(result, transcripts)
  assert.deepEqual(input.claims[0].citations.map(r => [r.sourceId, r.paragraphId]), [['M1', 'M1-P2'], ['M2', 'M2-P1']])
  assert.equal(input.claims[1].citations.length, 0)
  transcripts[0].content = '后来修改的输入'
  assert.equal(input.sources[0].paragraphs[1].text, 'U1：必须先由我核对。')
  const project = normalizeBundle(input, {})
  assert.equal(evidenceKeys(project, 'themes-1').length, 2)
  assert.match(confirmError(project, 'insights-1'), /至少一段/)
})

test('analysis service without configuration returns an explicit error without an upstream call', async () => {
  let body = ''
  const response = { setHeader() {}, end(value) { body = value } }
  await handleAnalysis({ method: 'POST' }, response, '')
  assert.equal(response.statusCode, 503)
  assert.match(JSON.parse(body).error.message, /尚未配置/)
})

test('upstream authentication errors stay distinguishable without exposing provider details or credentials', async () => {
  let body = ''
  const response = { setHeader() {}, end(value) { body = value } }
  const request = async () => ({ ok: false, status: 401 })
  await handleAnalysis({ method: 'POST', body: { messages: [{ role: 'system', content: 'synthetic check' }, { role: 'user', content: 'synthetic text' }] } }, response, 'test-key-not-a-real-credential', { request })
  const data = JSON.parse(body)
  assert.equal(response.statusCode, 502)
  assert.equal(data.error.upstreamStatus, 401)
  assert.match(data.error.message, /认证失败/)
  assert.ok(!body.includes('test-key-not-a-real-credential'))
})

test('upstream connection timeouts produce a separate actionable error', async () => {
  let body = ''
  const response = { setHeader() {}, end(value) { body = value } }
  const request = async () => { const e = new Error('network'); e.name = 'TimeoutError'; throw e }
  await handleAnalysis({ method: 'POST', body: { messages: [{ role: 'system', content: 'synthetic check' }, { role: 'user', content: 'synthetic text' }] } }, response, 'test-key-not-a-real-credential', { request })
  assert.equal(response.statusCode, 504)
  assert.equal(JSON.parse(body).error.code, 'UPSTREAM_TIMEOUT')
})

test('upstream insufficient balance reports the specific cause', async () => {
  let body = ''
  const response = { setHeader() {}, end(value) { body = value } }
  const request = async () => ({ ok: false, status: 402 })
  await handleAnalysis({ method: 'POST', body: { messages: [{ role: 'system', content: 'synthetic check' }, { role: 'user', content: 'synthetic text' }] } }, response, 'test-key-not-a-real-credential', { request })
  assert.equal(JSON.parse(body).error.upstreamStatus, 402)
  assert.match(JSON.parse(body).error.message, /余额不足/)
})
