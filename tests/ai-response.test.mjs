import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAiResponse, validateAnalysis } from '../src/research/ai-response.js'
const response = (content, finish_reason = 'stop') => ({ choices: [{ message: { content }, finish_reason }] })
test('complete JSON and JSON fences parse without rewriting their contents', () => {
  const json = '{"themes":[],"painPoints":[],"personas":[],"insights":[]}'
  assert.deepEqual(validateAnalysis(parseAiResponse(response(json))), JSON.parse(json))
  assert.deepEqual(parseAiResponse(response('```json\n' + json + '\n```')), JSON.parse(json))
})
test('truncated output is reported explicitly and never accepted as a complete analysis', () => {
  assert.throws(() => parseAiResponse(response('{"themes":[', 'length')), /输出长度/)
  assert.throws(() => parseAiResponse(response('{}', 'length')), /输出长度/)
})
test('empty, malformed and interrupted responses have actionable errors', () => {
  assert.throws(() => parseAiResponse(response('')), /空内容/)
  assert.throws(() => parseAiResponse({}), /空内容/)
  assert.throws(() => parseAiResponse(response('{"themes":[')), /格式不完整/)
  assert.throws(() => parseAiResponse(response('{}', 'content_filter')), /未能完成/)
  assert.throws(() => parseAiResponse(response('[]')), /结构不正确/)
})
test('analysis requires category arrays but allows categories without sufficient evidence to be empty', () => {
  assert.throws(() => validateAnalysis({ themes: [] }), /结构/)
  assert.throws(() => validateAnalysis({ themes: [null], painPoints: [], personas: [], insights: [] }), /结构/)
})
