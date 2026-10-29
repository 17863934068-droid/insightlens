export const STORAGE_KEY = 'insightlens-workspace-v1'
export const statusNames = { pending: '待审阅', edited: '已修改 · 待核对', confirmed: '已确认', excluded: '已排除' }
export const categoryNames = { citation_mismatch: '引用失配', overgeneralization: '概括过度', omitted_condition: '限制遗漏', unsupported_inference: '推断越界' }
export const relationNames = { supports: '支持', contradicts: '相反证据', limits: '适用边界', no_position: '未表态', reference: '关联原文' }
const text = value => typeof value === 'string' ? value : ''
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const unique = (rows, key, label) => {
  const ids = rows.map(row => row[key])
  assert(ids.every(id => typeof id === 'string' && id.trim() && !id.includes('|') && !['__proto__', 'constructor', 'prototype'].includes(id)) && new Set(ids).size === ids.length, `${label}编号不能为空、重复或含保留字符。`)
}

export function normalizeBundle(input, review = input?.review || {}, name) {
  assert(isObject(input) && isObject(review), '请输入有效的研究数据对象。')
  assert(Array.isArray(input.sources), '研究材料需要 sources 数组，含原文及段落编号。')
  const sources = input.sources.map(source => {
    assert(isObject(source) && Array.isArray(source.paragraphs), '每份来源都需要 paragraphs 段落数组。')
    const paragraphs = source.paragraphs.map(p => {
      assert(isObject(p) && typeof p.text === 'string', '段落需要 id 和文本 text。')
      return { id: p.id, text: p.text }
    })
    unique(paragraphs, 'id', '段落')
    return { sourceId: source.sourceId, participantId: text(source.participantId), name: text(source.name), role: text(source.role), date: text(source.date), method: text(source.method), paragraphs }
  })
  unique(sources, 'sourceId', '来源')
  const rawClaims = input.claims || review.reviewedTargets?.map(t => ({ id: t.targetId, text: t.targetText }))
  assert(Array.isArray(rawClaims), '需要 claims，或审阅结果中的 reviewedTargets。')
  const claims = rawClaims.map(c => {
    assert(isObject(c) && typeof c.text === 'string' && c.text.trim(), '每条结论需要非空 text。')
    return { id: c.id, text: c.text, title: text(c.title), evidence: text(c.evidence), citations: Array.isArray(c.citations) ? c.citations.map(normalizeRef) : [] }
  })
  unique(claims, 'id', '结论')
  const claimMap = new Map(claims.map(c => [c.id, c.text]))
  const issues = (review.issues || []).map(issue => {
    assert(isObject(issue) && claimMap.has(issue.targetId), '疑点必须关联已有结论 targetId。')
    assert(!issue.targetText || issue.targetText === claimMap.get(issue.targetId), `结论 ${issue.targetId} 与审阅版本不一致，请导入对应原稿。`)
    assert(Object.hasOwn(categoryNames, issue.category), '疑点 category 不属于支持的四类。')
    assert(typeof issue.span === 'string' && issue.span && claimMap.get(issue.targetId).includes(issue.span), '疑点 span 需要逐字出现在对应结论中。')
    return { id: issue.id, targetId: issue.targetId, span: issue.span, category: issue.category, assessment: issue.assessment, reason: text(issue.reason), suggestedRevision: text(issue.suggestedRevision), relatedEvidence: (issue.relatedEvidence || []).map(normalizeRef) }
  })
  unique(issues, 'id', '疑点')
  const scopeNotices = (review.scopeNotices || []).map(n => {
    assert(isObject(n) && claimMap.has(n.targetId), '材料提示必须关联已有结论。')
    return { id: n.id, targetId: n.targetId, sourceId: text(n.sourceId), paragraphId: text(n.paragraphId), reason: text(n.reason), neededMaterial: text(n.neededMaterial) }
  })
  unique(scopeNotices, 'id', '材料提示')
  const reviewedIds = (review.reviewedTargets || []).filter(t => t.reviewOutcome !== 'unverifiable').map(t => {
    assert(claimMap.has(t.targetId) && claimMap.get(t.targetId) === t.targetText, '审阅范围与输入结论不一致。')
    return t.targetId
  })
  return {
    id: crypto.randomUUID(), name: name || text(input.name) || '导入的研究项目',
    researchQuestion: text(input.researchQuestion), synthetic: input.synthetic === true,
    sources, claims, review: { issues, scopeNotices, reviewedIds, limitations: (review.reviewScope?.limitations || []).filter(x => typeof x === 'string') },
    entries: {}, history: [], createdAt: new Date().toISOString(),
  }
}
function normalizeRef(e) {
  assert(isObject(e) && typeof e.sourceId === 'string' && typeof e.paragraphId === 'string', '引用需要 sourceId 和 paragraphId。')
  return { sourceId: e.sourceId, paragraphId: e.paragraphId, quote: text(e.quote), relation: Object.hasOwn(relationNames, e.relation) ? e.relation : 'reference' }
}
export function entryFor(project, id) {
  return project.entries[id] || { text: project.claims.find(c => c.id === id)?.text || '', status: 'pending', note: '', seen: [], selectedRefs: [], draft: null }
}
export function refsFor(project, id) {
  const issueRefs = project.review.issues.filter(i => i.targetId === id).flatMap(i => i.relatedEvidence)
  const refs = [...issueRefs, ...(project.claims.find(c => c.id === id)?.citations || [])]
  const found = new Set()
  return refs.filter(e => {
    const key = `${e.sourceId}|${e.paragraphId}|${e.relation}|${e.quote}`
    if (found.has(key)) return false
    found.add(key)
    return true
  })
}
export function locate(project, ref) {
  return project.sources.find(s => s.sourceId === ref.sourceId)?.paragraphs.find(p => p.id === ref.paragraphId)
}
export function gapsFor(project, id) {
  const notices = project.review.scopeNotices.filter(n => n.targetId === id && !locate(project, n))
  const missing = refsFor(project, id).filter(ref => !locate(project, ref)).map(ref => ({ ...ref, reason: '当前项目中没有这份原文或指定段落。', neededMaterial: `${ref.sourceId} / ${ref.paragraphId}` }))
  return [...notices, ...missing.filter(m => !notices.some(n => n.sourceId === m.sourceId && n.paragraphId === m.paragraphId))]
}
export function evidenceKeys(project, id) {
  const refs = refsFor(project, id).filter(e => locate(project, e)).map(e => `${e.sourceId}|${e.paragraphId}`)
  return [...new Set([...refs, ...entryFor(project, id).selectedRefs])]
}
export function kindFor(project, id) {
  if (gapsFor(project, id).length) return 'missing'
  if (project.review.issues.some(i => i.targetId === id)) return 'flagged'
  return project.review.reviewedIds.includes(id) ? 'clear' : 'unchecked'
}
export function updateEntry(project, id, patch, action) {
  const old = entryFor(project, id)
  const next = { ...old, ...patch }
  if (old.status === 'confirmed' && (next.text !== old.text || next.note !== old.note || JSON.stringify(next.seen) !== JSON.stringify(old.seen) || JSON.stringify(next.selectedRefs) !== JSON.stringify(old.selectedRefs))) next.status = next.text === project.claims.find(c => c.id === id).text ? 'pending' : 'edited'
  return { ...project, entries: { ...project.entries, [id]: next }, history: action ? [...project.history, { id: crypto.randomUUID(), targetId: id, action, at: new Date().toISOString(), before: old.text, after: next.text, note: next.note, status: next.status }] : project.history }
}
export function confirmError(project, id) {
  const e = entryFor(project, id)
  if (e.draft !== null) return '请先保存或取消当前编辑。'
  if (gapsFor(project, id).length) return '原文材料不完整，请先补充材料，也可排除此条。'
  const required = evidenceKeys(project, id)
  if (!required.length) return '请先在原文中选择至少一段作为本次判断依据。'
  if (required.some(key => !e.seen.includes(key))) return '请核对全部关联原文，并勾选已核对。'
  return ''
}
export function exportProject(project) {
  return { format: 'insightlens-research-project', version: 1, exportedAt: new Date().toISOString(), project }
}
export function parseBackup(value) {
  assert(value?.format === 'insightlens-research-project' && value.version === 1 && isObject(value.project), '备份格式或版本不支持。')
  const p = value.project
  const clean = normalizeBundle({ ...p, review: undefined }, { ...p.review, reviewScope: { limitations: p.review?.limitations || [] }, reviewedTargets: (p.review?.reviewedIds || []).map(id => ({ targetId: id, targetText: p.claims?.find(c => c.id === id)?.text })) }, p.name)
  clean.createdAt = text(p.createdAt) || clean.createdAt
  clean.history = Array.isArray(p.history) ? p.history.filter(h => isObject(h) && typeof h.action === 'string' && typeof h.at === 'string' && typeof h.targetId === 'string').map(h => ({ id: text(h.id), action: h.action, at: h.at, targetId: h.targetId, before: text(h.before), after: text(h.after), note: text(h.note), status: text(h.status) })) : []
  for (const claim of clean.claims) {
    const e = p.entries?.[claim.id]
    if (!isObject(e)) continue
    clean.entries[claim.id] = { text: text(e.text) || claim.text, status: Object.hasOwn(statusNames, e.status) ? e.status : 'pending', note: text(e.note), draft: typeof e.draft === 'string' ? e.draft : null, seen: Array.isArray(e.seen) ? e.seen.filter(x => typeof x === 'string') : [], selectedRefs: Array.isArray(e.selectedRefs) ? e.selectedRefs.filter(x => typeof x === 'string' && clean.sources.some(s => s.paragraphs.some(p => `${s.sourceId}|${p.id}` === x))) : [] }
    if (clean.entries[claim.id].status === 'confirmed' && confirmError(clean, claim.id)) clean.entries[claim.id].status = 'pending'
  }
  return clean
}
export function reportMarkdown(p) {
  const lines = [`# ${p.name}`, '', `研究问题：${p.researchQuestion || '未填写'}`, `材料：${p.sources.length} 份；${p.synthetic ? '合成示例' : '使用者导入'}。`, '', '状态为研究者的操作记录，不代表系统保证结论正确。', '', '## 访谈基础信息', '', ...p.sources.map(s => `- ${s.sourceId}：${s.name || '未命名访谈'} / ${s.role || '角色未填写'} / ${s.date || '日期未填写'} / ${s.method || '方式未填写'}`), '']
  for (const c of p.claims) {
    const e = entryFor(p, c.id)
    lines.push(`## ${c.id} · ${statusNames[e.status]}`, '', e.text, '', `审阅依据：${e.note || '尚未填写'}`, '')
    if (e.text !== c.text) lines.push(`原始版本：${c.text}`, '')
    for (const i of p.review.issues.filter(i => i.targetId === c.id)) lines.push(`- 原始结论提示［${categoryNames[i.category]}］：${i.reason}`)
    for (const n of gapsFor(p, c.id)) lines.push(`- 待补材料：${n.neededMaterial || n.reason}`)
    for (const key of evidenceKeys(p, c.id)) {
      const [sid, pid] = key.split('|')
      const source = p.sources.find(s => s.sourceId === sid)
      const paragraph = source?.paragraphs.find(q => q.id === pid)
      if (paragraph) lines.push(`- 原文 ${source.name || source.sourceId} / ${pid}［${e.seen.includes(key) ? '已核对' : '未核对'}］：${paragraph.text}`)
    }
    lines.push('')
  }
  lines.push('## 检查范围与限制', '', ...p.review.limitations.map(l => `- ${l}`), '', '## 审阅记录', '', ...p.history.map(h => `- ${h.at} / ${h.targetId} / ${h.action}${h.note ? ` / ${h.note}` : ''}`))
  return lines.join('\n')
}
