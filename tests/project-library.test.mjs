import test from 'node:test'
import assert from 'node:assert/strict'
import { newResearchProject, newInterview, patchResearchProject, projectBackup, restoreResearchProject, loadProjectLibrary, LIBRARY_KEY, analysisIsOutdated, countParticipants, resetWorkspace } from '../src/research/project-library.js'
import { analysisBundle } from '../src/research/result-adapter.js'
import { normalizeBundle, exportProject, reportMarkdown, parseBackup } from '../src/research/model.js'

test('return to start clears the entire workspace while retaining projects and reusing the blank draft', () => {
  const saved = newResearchProject({ name: '现有研究', topic: '核对体验', question: '如何核对？', transcripts: [{ ...newInterview(), role: '经理', content: '完整原稿' }], reviewBundle: { input: { claims: [] } } })
  const library = { activeId: saved.id, projects: [saved] }
  const reset = resetWorkspace(library)
  assert.deepEqual(reset.projects.find(p => p.id === saved.id), saved)
  const blank = reset.projects.find(p => p.id === reset.activeId)
  assert.equal(blank.topic, '')
  assert.equal(blank.question, '')
  assert.equal(blank.reviewBundle, null)
  assert.equal(blank.transcripts[0].content, '')
  assert.equal(blank.transcripts[0].role, '')
  assert.equal(resetWorkspace(reset).projects.length, 2)
  assert.equal(resetWorkspace({ ...reset, activeId: saved.id }).activeId, blank.id)
})

test('project backup retains research details, interview metadata, original transcript and review decisions', () => {
  const project = newResearchProject({ name: '纪要研究', topic: 'AI 纪要核对', question: '哪些内容最需要核对？' })
  const tr = { ...newInterview(), name: '首次访谈', participantId: 'U01', role: '项目协调', date: '2026-10-29', method: '线上视频', content: 'U01：我必须先检查。' }
  project.transcripts = [tr]
  const input = analysisBundle({ insights: [{ title: '核对需求', description: '需要先检查', nextStep: '验证', evidence: '我必须先检查。' }] }, project.transcripts, project)
  const review = normalizeBundle(input, {})
  review.entries['insights-1'] = { text: input.claims[0].text, status: 'pending', note: '留待下一轮访谈验证', seen: [], selectedRefs: [], draft: '未保存的修订' }
  project.reviewBundle = { backup: exportProject(review) }
  const restored = restoreResearchProject(projectBackup(project))
  assert.notEqual(restored.id, project.id)
  assert.deepEqual(restored.transcripts, project.transcripts)
  assert.equal(restored.question, project.question)
  assert.equal(restored.reviewBundle.backup.project.entries['insights-1'].draft, '未保存的修订')
  assert.match(reportMarkdown(parseBackup(restored.reviewBundle.backup)), /项目协调 \/ 2026-10-29 \/ 线上视频/)
})

test('editing and switching projects keeps each transcript and review separate', () => {
  const a = newResearchProject({ name: '研究 A' }); const b = newResearchProject({ name: '研究 B' })
  const library = { activeId: a.id, projects: [a, b] }
  const changed = patchResearchProject(library, a.id, { transcripts: [{ ...a.transcripts[0], participantId: 'U01', content: 'A 的原稿' }] })
  assert.equal(changed.projects[1].transcripts[0].content, '')
  assert.equal(library.projects[0].transcripts[0].content, '')
  const storage = { getItem: key => key === LIBRARY_KEY ? JSON.stringify({ ...changed, format: 'insightlens-project-library', version: 1 }) : null }
  const restored = loadProjectLibrary(storage)
  assert.equal(restored.activeId, a.id)
  assert.equal(restored.projects[0].transcripts[0].content, 'A 的原稿')
})

test('old single-review storage migrates to a project without deleting or changing the stored value', () => {
  const backup = exportProject(normalizeBundle({ sources: [{ sourceId: 'M01', participantId: 'U01', paragraphs: [{ id: 'P1', text: '合成原稿' }] }], claims: [{ id: 'R1', text: '合成结论' }] }, {}))
  const raw = JSON.stringify(backup)
  const storage = { getItem: key => key === 'insightlens-site-review-v1' ? raw : null }
  const restored = loadProjectLibrary(storage)
  assert.equal(restored.projects[0].transcripts[0].participantId, 'U01')
  assert.equal(restored.projects[0].transcripts[0].content, '合成原稿')
  assert.deepEqual(restored.projects[0].reviewBundle.backup, backup)
})

test('source changes are shown as outdated without overwriting the previous analysis snapshot', () => {
  const project = newResearchProject({ topic: '主题', question: '问题' })
  project.transcripts[0].content = '最初原稿'
  project.reviewBundle = { transcriptSnapshot: structuredClone(project.transcripts), topicSnapshot: '主题', questionSnapshot: '问题' }
  assert.equal(analysisIsOutdated(project), false)
  project.transcripts[0].participantId = 'U02'
  assert.equal(analysisIsOutdated(project), true)
  assert.equal(project.reviewBundle.transcriptSnapshot[0].participantId, '')
})

test('participant counts deduplicate explicit IDs and do not count unidentified interviews', () => {
  const project = newResearchProject({ transcripts: [{ ...newInterview(), participantId: 'U01' }, { ...newInterview(), participantId: ' U01 ' }, newInterview()] })
  assert.equal(countParticipants(project), 1)
})

test('corrupt stored data is rejected and cannot silently turn into an empty library', () => {
  assert.throws(() => loadProjectLibrary({ getItem: () => '{broken' }))
  assert.throws(() => restoreResearchProject({ format: 'insightlens-interview-project', version: 1, project: { name: '坏备份', transcripts: [{ content: 42 }] } }), /原稿/)
})

test('trash and restore preserve the entire project across reload and choose a live active project', async () => {
  const { trashResearchProject, recoverResearchProject } = await import('../src/research/project-library.js')
  const a = newResearchProject({ name: '待恢复', question: '原来的问题' }); const b = newResearchProject({ name: '保留' })
  a.transcripts[0].content = '完整原稿'
  const library = { format: 'insightlens-project-library', version: 1, activeId: a.id, projects: [a, b] }
  const deleted = trashResearchProject(library, a.id)
  assert.equal(deleted.activeId, b.id)
  assert.equal(library.projects[0].deletedAt, undefined)
  const loaded = loadProjectLibrary({ getItem: key => key === LIBRARY_KEY ? JSON.stringify(deleted) : null })
  assert.ok(loaded.projects[0].deletedAt)
  const restored = recoverResearchProject(loaded, a.id)
  assert.equal(restored.activeId, a.id)
  assert.equal(restored.projects[0].transcripts[0].content, '完整原稿')
  assert.equal(restored.projects[0].question, '原来的问题')
  assert.equal(restored.projects[0].deletedAt, '')
})

test('deleting the last project retains a recoverable copy and creates a usable blank project', async () => {
  const { trashResearchProject } = await import('../src/research/project-library.js')
  const a = newResearchProject()
  const deleted = trashResearchProject({ activeId: a.id, projects: [a] }, a.id)
  assert.equal(deleted.projects.length, 2)
  assert.notEqual(deleted.activeId, a.id)
  assert.ok(deleted.projects.find(p => p.id === a.id).deletedAt)
  assert.equal(deleted.projects.find(p => p.id === deleted.activeId).transcripts[0].content, '')
  assert.equal(trashResearchProject(deleted, a.id), deleted)
})
