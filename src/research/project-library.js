import { normalizeBundle, parseBackup } from './model.js'
export const LIBRARY_KEY = 'insightlens-projects-v1'
const copy = value => JSON.parse(JSON.stringify(value))
const str = value => typeof value === 'string' ? value : ''
export function newInterview() {
  return { id: crypto.randomUUID(), name: '', participantId: '', role: '', date: '', method: '', content: '' }
}
export function newResearchProject(fields = {}) {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), name: '未命名研究', topic: '', question: '', createdAt: now, updatedAt: now, transcripts: [newInterview()], reviewBundle: null, reviewVersion: 0, ...fields }
}
export function resetWorkspace(library) {
  const blank = library.projects.find(p => !p.deletedAt && (!p.name || p.name === '未命名研究') && !p.topic && !p.question && !p.reviewBundle && p.transcripts.length === 1 && !['name', 'participantId', 'role', 'date', 'method', 'content'].some(key => p.transcripts[0][key]))
  if (blank) return { ...library, activeId: blank.id }
  const project = newResearchProject()
  return { ...library, activeId: project.id, projects: [...library.projects, project] }
}
export function patchResearchProject(library, id, patch) {
  return { ...library, projects: library.projects.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p) }
}
export function projectBackup(project) { return { format: 'insightlens-interview-project', version: 1, exportedAt: new Date().toISOString(), project: copy(project) } }
export function restoreResearchProject(value) {
  if (value?.format !== 'insightlens-interview-project' || value.version !== 1) throw new Error('这不是访谈项目备份。')
  const p = value.project
  if (!p || typeof p.name !== 'string' || !Array.isArray(p.transcripts) || !p.transcripts.length) throw new Error('项目名称或访谈材料不完整。')
  const transcripts = p.transcripts.map(t => {
    if (!t || typeof t.content !== 'string') throw new Error('访谈原稿格式不正确。')
    return { id: str(t.id) || crypto.randomUUID(), name: str(t.name), participantId: str(t.participantId), role: str(t.role), date: str(t.date), method: str(t.method), content: t.content }
  })
  if (new Set(transcripts.map(t => t.id)).size !== transcripts.length) throw new Error('访谈编号重复。')
  if (p.reviewBundle) {
    if (p.reviewBundle.backup) parseBackup(p.reviewBundle.backup)
    else normalizeBundle(p.reviewBundle.input, p.reviewBundle.review)
  }
  return newResearchProject({ name: p.name, topic: str(p.topic), question: str(p.question), transcripts, reviewBundle: p.reviewBundle ? copy(p.reviewBundle) : null, reviewVersion: Number.isInteger(p.reviewVersion) ? p.reviewVersion : 0, deletedAt: str(p.deletedAt), createdAt: str(p.createdAt) || new Date().toISOString(), updatedAt: str(p.updatedAt) || new Date().toISOString() })
}
export function projectFromReview(backup) {
  const review = parseBackup(backup)
  return newResearchProject({ name: review.synthetic ? '合成访谈审阅示例' : review.name, topic: review.researchQuestion, transcripts: review.sources.map(s => ({ ...newInterview(), name: s.name || s.sourceId, participantId: s.participantId, role: s.role || '', date: s.date || '', method: s.method || '', content: s.paragraphs.map(p => p.text).join('\n\n') })), reviewBundle: { backup }, reviewVersion: 1 })
}
export function loadProjectLibrary(storage) {
  const raw = storage.getItem(LIBRARY_KEY)
  if (raw) {
    const value = JSON.parse(raw)
    if (value.format !== 'insightlens-project-library' || value.version !== 1 || !Array.isArray(value.projects) || !value.projects.length) throw new Error('项目库格式不正确。原数据已保留，请先导出恢复。')
    const projects = value.projects.map(p => ({ ...restoreResearchProject(projectBackup(p)), id: p.id }))
    if (projects.some(p => typeof p.id !== 'string' || !p.id) || new Set(projects.map(p => p.id)).size !== projects.length) throw new Error('项目编号无效。')
    if (!projects.some(p => !p.deletedAt)) projects.push(newResearchProject())
    return { ...value, projects, activeId: projects.some(p => p.id === value.activeId && !p.deletedAt) ? value.activeId : projects.find(p => !p.deletedAt).id }
  }
  const previous = storage.getItem('insightlens-site-review-v1')
  const project = previous ? projectFromReview(JSON.parse(previous)) : newResearchProject()
  return { format: 'insightlens-project-library', version: 1, activeId: project.id, projects: [project] }
}
export function analysisIsOutdated(project) {
  const snapshot = project.reviewBundle?.transcriptSnapshot
  if (!snapshot) return false
  return JSON.stringify(snapshot) !== JSON.stringify(project.transcripts.filter(t => t.content.trim())) || project.reviewBundle.topicSnapshot !== project.topic || project.reviewBundle.questionSnapshot !== project.question
}
export function countParticipants(project) {
  return new Set(project.transcripts.map(t => t.participantId.trim()).filter(Boolean)).size
}

export function trashResearchProject(library, id) {
  const target = library.projects.find(p => p.id === id && !p.deletedAt)
  if (!target) return library
  const projects = library.projects.map(p => p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p)
  if (!projects.some(p => !p.deletedAt)) projects.push(newResearchProject())
  return { ...library, projects, activeId: library.activeId === id ? projects.find(p => !p.deletedAt).id : library.activeId }
}
export function recoverResearchProject(library, id) {
  const target = library.projects.find(p => p.id === id && p.deletedAt)
  if (!target) return library
  return { ...library, projects: library.projects.map(p => p.id === id ? { ...p, deletedAt: '' } : p), activeId: id }
}
