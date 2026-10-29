import { useEffect, useRef, useState } from 'react'
import demoInput from '../data/demo-input.json'
import demoReview from '../data/demo-review.json'
import { STORAGE_KEY, categoryNames, statusNames, relationNames, normalizeBundle, entryFor, refsFor, locate, gapsFor, evidenceKeys, kindFor, updateEntry, confirmError, exportProject, parseBackup, reportMarkdown } from './model.js'

const SKILL_URL = 'https://github.com/17863934068-droid/insightlens-skill'
const filters = [['all', '全部结论'], ['flagged', '有疑点'], ['missing', '待补材料'], ['confirmed', '已确认'], ['excluded', '已排除']]
const kinds = { flagged: '有疑点', missing: '待补材料', clear: '未标疑点', unchecked: '尚未检查' }

function initialWorkspace() {
  let raw
  try {
    raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved.version !== 1 || !Array.isArray(saved.projects) || !saved.projects.length) throw new Error('备份版本不兼容')
      const projects = saved.projects.map(p => ({ ...parseBackup({ format: 'insightlens-research-project', version: 1, project: p }), id: p.id }))
      return { projects, activeId: projects.some(p => p.id === saved.activeId) ? saved.activeId : projects[0].id, views: saved.views || {}, loadError: '' }
    }
  } catch {
    const p = normalizeBundle(demoInput, demoReview, '团队会议纪要研究')
    return { projects: [p], activeId: p.id, views: {}, loadError: raw ? '已有浏览器记录暂时无法读取，已暂停自动保存以保护原记录。你仍可导出当前项目。' : '浏览器存储不可用，请及时导出项目备份。' }
  }
  const project = normalizeBundle(demoInput, demoReview, '团队会议纪要研究')
  return { projects: [project], activeId: project.id, views: {}, loadError: '' }
}
function download(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
function stamp(at) {
  const date = new Date(at)
  return Number.isNaN(date.valueOf()) ? at : date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function MarkedText({ text, spans = [], onSelect }) {
  const ranges = spans.map(i => ({ ...i, start: text.indexOf(i.span) })).filter(i => i.start >= 0).sort((a, b) => a.start - b.start)
  const parts = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start < cursor) continue
    parts.push(text.slice(cursor, range.start))
    parts.push(<button className={`iw-inline-mark ${range.category === 'citation_mismatch' ? 'is-mismatch' : ''}`} key={range.id} onClick={() => onSelect(range)} aria-label={`查看疑点：${range.span}`}>{range.span}</button>)
    cursor = range.start + range.span.length
  }
  parts.push(text.slice(cursor))
  return parts
}
function Quoted({ text, quote }) {
  const start = quote ? text.indexOf(quote) : -1
  return start < 0 ? text : <>{text.slice(0, start)}<mark>{quote}</mark>{text.slice(start + quote.length)}</>
}

export default function Workspace() {
  const [state, setState] = useState(initialWorkspace)
  const [saveStatus, setSaveStatus] = useState('已保存在此浏览器')
  const [feedback, setFeedback] = useState('')
  const [dialog, setDialog] = useState(null)
  const [importError, setImportError] = useState('')
  const [importFiles, setImportFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [question, setQuestion] = useState('')
  const [material, setMaterial] = useState({ sourceId: '', paragraphId: '', participantId: '', text: '' })
  const dialogRef = useRef(null)
  const paragraphRefs = useRef({})
  const project = state.projects.find(p => p.id === state.activeId) || state.projects[0]
  const view = state.views[project.id] || {}
  const tab = view.tab || 'review'
  const filter = view.filter || 'all'
  const search = view.search || ''
  const claim = project.claims.find(c => c.id === view.claimId) || project.claims.find(c => c.id === 'R09') || project.claims[0]
  const entry = claim ? entryFor(project, claim.id) : null
  const issues = project.review.issues.filter(i => i.targetId === claim?.id)
  const refs = claim ? refsFor(project, claim.id) : []
  const gaps = claim ? gapsFor(project, claim.id) : []
  const required = claim ? evidenceKeys(project, claim.id) : []
  const selectedIssue = issues.find(i => i.id === view.issueId)
  const focusRef = selectedIssue?.relatedEvidence[0] || refs[0]
  const source = project.sources.find(s => s.sourceId === view.sourceId) || project.sources.find(s => s.sourceId === focusRef?.sourceId) || project.sources[0]
  const paragraphId = view.paragraphId || focusRef?.paragraphId
  const focusKey = `${project.id}|${view.sourceId}|${view.paragraphId}|${tab}`
  const lastFocus = useRef(focusKey)
  const visible = project.claims.filter(c => {
    const e = entryFor(project, c.id)
    const kind = kindFor(project, c.id)
    const matchesFilter = filter === 'all' || (filter === 'flagged' ? kind === 'flagged' || (kind === 'missing' && project.review.issues.some(i => i.targetId === c.id)) : filter === 'missing' ? kind === 'missing' : e.status === filter)
    return matchesFilter && `${c.id} ${e.text}`.toLowerCase().includes(search.toLowerCase())
  })
  const confirmed = project.claims.filter(c => entryFor(project, c.id).status === 'confirmed').length
  const flagged = project.claims.filter(c => project.review.issues.some(i => i.targetId === c.id)).length
  const missing = project.claims.filter(c => gapsFor(project, c.id).length).length
  const participants = [...new Set(project.sources.map(s => s.participantId).filter(Boolean))]

  useEffect(() => {
    if (state.loadError) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, projects: state.projects, activeId: state.activeId, views: state.views }))
        setSaveStatus('已保存在此浏览器')
      } catch { setSaveStatus('保存失败，请导出备份，避免刷新丢失') }
    }, 300)
    return () => clearTimeout(timer)
  }, [state])
  useEffect(() => {
    if (dialog) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [dialog])
  useEffect(() => {
    if (lastFocus.current === focusKey) return
    lastFocus.current = focusKey
    const paragraph = paragraphRefs.current[paragraphId]
    const pane = paragraph?.parentElement
    if (tab === 'review' && pane && pane.scrollHeight > pane.clientHeight) pane.scrollTo({ top: paragraph.offsetTop - 12, behavior: 'smooth' })
  }, [focusKey, paragraphId, tab])

  function mutate(fn) {
    setState(s => ({ ...s, projects: s.projects.map(p => p.id === project.id ? fn(p) : p) }))
    setSaveStatus('正在保存…')
  }
  function setView(patch) {
    setState(s => ({ ...s, views: { ...s.views, [project.id]: { ...s.views[project.id], ...patch } } }))
    setFeedback('')
  }
  function selectClaim(c, extra = {}) {
    const first = refsFor(project, c.id).find(e => locate(project, e))
    setView({ claimId: c.id, issueId: null, sourceId: first?.sourceId, paragraphId: first?.paragraphId, ...extra })
  }
  function patchEntry(patch, action) {
    if (claim) mutate(p => updateEntry(p, claim.id, patch, action))
    setFeedback('')
  }
  function openDialog(kind) {
    setImportError(''); setImportFiles([]); setProjectName(''); setQuestion(''); setDialog(kind)
  }
  function addProject(p, replaceEmpty = false) {
    if (replaceEmpty && !project.claims.length && !project.sources.length) {
      p.id = project.id
      p.name = projectName.trim() || project.name
      p.researchQuestion ||= project.researchQuestion
      setState(s => ({ ...s, projects: s.projects.map(old => old.id === project.id ? p : old), activeId: p.id }))
    } else setState(s => ({ ...s, projects: [...s.projects, p], activeId: p.id }))
    setDialog(null)
    setFeedback('项目已导入。审阅记录在当前浏览器中独立保存。')
  }
  async function importProject(event) {
    event.preventDefault()
    try {
      if (!importFiles.length) throw new Error('请选择研究输入、Skill 审阅结果，或网页项目备份。')
      if (importFiles.some(f => f.size > 5 * 1024 * 1024)) throw new Error('单个文件请控制在 5 MB 以内。')
      const values = await Promise.all(importFiles.map(async file => {
        try { return JSON.parse(await file.text()) } catch { throw new Error(`${file.name} 不是有效的 JSON 文件。`) }
      }))
      if (values.some(v => v?.format === 'insightlens-research-project')) {
        if (values.length !== 1) throw new Error('恢复项目备份时，请只选择这一份备份。')
        const restored = parseBackup(values[0])
        if (projectName.trim()) restored.name = projectName.trim()
        addProject(restored)
        return
      }
      const input = values.find(v => Array.isArray(v?.sources))
      const review = values.find(v => Array.isArray(v?.issues) || Array.isArray(v?.reviewedTargets)) || input?.review || {}
      if (!input) throw new Error('缺少原始材料，请同时选择含 sources 的研究输入。')
      if (values.length > 2) throw new Error('一次选择一份研究输入和一份审阅结果，或一份合并研究包。')
      addProject(normalizeBundle(input, review, projectName.trim() || input.name || '导入的研究项目'), true)
    } catch (error) { setImportError(error.message) }
  }
  function createProject(event) {
    event.preventDefault()
    if (!projectName.trim()) return
    addProject(normalizeBundle({ sources: [], claims: [], researchQuestion: question.trim() }, {}, projectName.trim()))
  }
  function openMaterial(gap) {
    setMaterial({ sourceId: gap.sourceId, paragraphId: gap.paragraphId, participantId: project.sources.find(s => s.sourceId === gap.sourceId)?.participantId || '', text: '' })
    setImportError(''); setDialog('source')
  }
  function addMaterial(event) {
    event.preventDefault()
    try {
      const sourceId = material.sourceId.trim(), paragraphId = material.paragraphId.trim()
      if (!material.text.trim()) throw new Error('请提供对应段落的原文。')
      if (project.sources.some(s => s.sourceId === sourceId && s.paragraphs.some(p => p.id === paragraphId))) throw new Error('该段落已存在；此入口只补充缺失材料，不覆盖现有原文。')
      const existing = project.sources.find(s => s.sourceId === sourceId)
      const sources = existing ? project.sources.map(s => s === existing ? { ...s, paragraphs: [...s.paragraphs, { id: paragraphId, text: material.text }] } : s) : [...project.sources, { sourceId, participantId: material.participantId.trim(), paragraphs: [{ id: paragraphId, text: material.text }] }]
      normalizeBundle({ sources, claims: project.claims }, {})
      mutate(p => ({ ...p, sources, history: [...p.history, { id: crypto.randomUUID(), targetId: claim.id, action: `补充原文 ${paragraphId}`, at: new Date().toISOString(), before: entry.text, after: entry.text, note: '原文已补充，尚未重新运行 AI 审阅。', status: entry.status }] }))
      setView({ sourceId, paragraphId, issueId: null }); setDialog(null)
      setFeedback('原文已补充。请重新核对当前结论，AI 审阅尚未重新运行。')
    } catch (error) { setImportError(error.message) }
  }
  function confirm() {
    const error = confirmError(project, claim.id)
    if (error) { setFeedback(error); return }
    patchEntry({ status: 'confirmed' }, '确认当前版本')
    setFeedback('已确认当前版本；再次修改文字、依据或原文核对记录后，需要重新确认。')
  }
  function exclude() {
    if (!entry.note.trim()) { setFeedback('请先填写排除原因。'); return }
    patchEntry({ status: 'excluded', draft: null }, '排除结论')
  }
  function saveEdit() {
    if (!entry.draft.trim()) { setFeedback('结论不能为空。如不采用这条结论，请记录原因后排除。'); return }
    patchEntry({ text: entry.draft.trim(), draft: null, status: 'edited' }, '保存修订')
    setFeedback('修订已保存。原始疑点仍保留供参考，尚未重新运行 AI 分析。')
  }
  function toggleSeen(key) {
    const seen = entry.seen.includes(key) ? entry.seen.filter(k => k !== key) : [...entry.seen, key]
    patchEntry({ seen }, entry.seen.includes(key) ? '撤回原文核对' : '核对原文')
  }
  function toggleEvidence(key) {
    const selectedRefs = entry.selectedRefs.includes(key) ? entry.selectedRefs.filter(k => k !== key) : [...entry.selectedRefs, key]
    patchEntry({ selectedRefs }, entry.selectedRefs.includes(key) ? '移除人工关联原文' : '关联判断原文')
  }
  function downloadExample() {
    download('insightlens-example.json', JSON.stringify({ ...demoInput, name: '团队会议纪要研究', review: demoReview }, null, 2))
  }
  function exportBackup() { download(`${project.name}-项目备份.json`, JSON.stringify(exportProject(project), null, 2)) }
  function exportReport() { download(`${project.name}-审阅报告.md`, reportMarkdown(project), 'text/markdown;charset=utf-8') }

  return <div className="iw-app">
    <aside className="iw-sidebar" aria-label="研究项目">
      <a className="iw-brand" href="#" onClick={e => { e.preventDefault(); setView({ tab: 'review' }) }}><span className="iw-brand-icon">iL</span><span>InsightLens<small>RESEARCH WORKSPACE</small></span></a>
      <button className="iw-new-project" onClick={() => openDialog('create')}><span>＋</span> 新建研究项目</button>
      <div className="iw-nav-heading">我的研究 <span>{state.projects.length}</span></div>
      <nav className="iw-projects">{state.projects.map(p => <button key={p.id} className={`iw-project ${p.id === project.id ? 'is-active' : ''}`} aria-current={p.id === project.id ? 'page' : undefined} onClick={() => { setState(s => ({ ...s, activeId: p.id })); setFeedback('') }}><span className="iw-project-symbol">▧</span><span>{p.name}<small>{p.synthetic ? '合成示例' : '研究项目'} · {p.claims.length} 条结论</small></span></button>)}</nav>
      <div className="iw-sidebar-bottom"><p>让每一次判断<br />都有原文可循。</p><a href={SKILL_URL} target="_blank" rel="noreferrer">获取分析 Skill <span>↗</span></a><span className="iw-local"><span /> 项目保存在当前浏览器</span></div>
    </aside>
    <div className="iw-main">
      <header className="iw-topbar"><div className="iw-breadcrumb">我的研究 <span>/</span> {project.name}</div><div className="iw-top-actions"><span className="iw-save" role="status">{state.loadError ? '自动保存已暂停' : saveStatus}</span><button className="iw-button" onClick={() => openDialog('import')}>导入研究包</button><button className="iw-button iw-primary" onClick={() => openDialog('export')}>导出项目 <span>↗</span></button></div></header>
      {state.loadError && <div className="iw-storage-warning" role="alert">{state.loadError}</div>}
      <section className="iw-project-heading"><div><div className="iw-eyebrow">研究工作台 <span>/</span> {project.synthetic ? '合成样本 · 预生成分析' : '研究者导入材料'}</div><h1>{project.name}</h1><p>{project.researchQuestion || '先导入材料与分析草稿，再逐条核对结论。'}</p><div className="iw-project-meta"><span>{project.sources.length} 份访谈材料</span><span>{participants.length} 位已标识受访者</span><span>{project.claims.length} 条结论</span></div></div><div className="iw-progress"><div><strong>{confirmed}<span> / {project.claims.length}</span></strong><small>条结论已确认</small></div><div className="iw-progress-track"><span style={{ width: `${project.claims.length ? confirmed / project.claims.length * 100 : 0}%` }} /></div><p>{flagged} 条有疑点 <span>·</span> {missing} 条待补材料</p></div></section>
      <nav className="iw-tabs" aria-label="工作台视图">{[['review', '疑点审阅', '01'], ['matrix', '证据矩阵', '02'], ['history', '审阅记录', '03']].map(([key, label, number]) => <button key={key} className={tab === key ? 'is-active' : ''} aria-current={tab === key ? 'page' : undefined} onClick={() => setView({ tab: key })}><span>{number}</span>{label}{key === 'history' && project.history.length > 0 && <small>{project.history.length}</small>}</button>)}</nav>
      {!project.claims.length ? <section className="iw-empty"><span className="iw-empty-icon">▧</span><h2>让研究材料在这里汇合</h2><p>导入访谈原文和 Skill 的分析结果，开始对照、修改与记录判断。</p><button className="iw-button iw-primary" onClick={() => openDialog('import')}>导入研究包</button><button className="iw-text-button" onClick={downloadExample}>下载合成示例，了解格式 ↗</button></section> : <>
        {tab === 'review' && <div className="iw-review-layout">
          <section className="iw-queue" aria-label="结论列表"><div className="iw-queue-head"><h2>结论清单 <span>{project.claims.length}</span></h2><label className="iw-search"><span>⌕</span><input aria-label="搜索结论" placeholder="搜索结论或编号" value={search} onChange={e => setView({ search: e.target.value })} /></label><select aria-label="筛选结论" value={filter} onChange={e => setView({ filter: e.target.value })}>{filters.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div className="iw-claim-list">{visible.map(c => {
            const e = entryFor(project, c.id), kind = kindFor(project, c.id)
            return <button key={c.id} className={`iw-claim-item ${claim?.id === c.id ? 'is-active' : ''}`} onClick={() => selectClaim(c)} aria-pressed={claim?.id === c.id}><span className="iw-claim-top"><span>{c.id}</span><span className={`iw-mini-status is-${e.status}`}>{e.status === 'pending' ? kinds[kind] : statusNames[e.status]}</span></span><span className="iw-claim-text">{e.text}</span><span className="iw-claim-bottom">{evidenceKeys(project, c.id).length} 段关联原文 <span>↗</span></span></button>
          })}{!visible.length && <p className="iw-list-empty">没有符合条件的结论。<button className="iw-text-button" onClick={() => setView({ search: '', filter: 'all' })}>查看全部</button></p>}</div></section>
          <section className="iw-review-editor" aria-label="结论审阅">
            <div className="iw-panel-heading"><span>审阅结论 <b>{claim.id}</b></span><span className={`iw-status is-${entry.status}`}>{statusNames[entry.status]}</span></div>
            <div className="iw-editor-content"><div className="iw-section-label">当前结论</div><div className="iw-conclusion">{entry.text === claim.text ? <MarkedText text={claim.text} spans={issues} onSelect={i => setView({ issueId: i.id, sourceId: i.relatedEvidence[0]?.sourceId, paragraphId: i.relatedEvidence[0]?.paragraphId })} /> : entry.text}</div>
              {entry.text !== claim.text && <details className="iw-original"><summary>查看原始结论与标记</summary><p><MarkedText text={claim.text} spans={issues} onSelect={i => setView({ issueId: i.id, sourceId: i.relatedEvidence[0]?.sourceId, paragraphId: i.relatedEvidence[0]?.paragraphId })} /></p><small>以下疑点针对原始版本，修改后尚未重新分析。</small></details>}
              <div className="iw-issues">{issues.map(i => <article key={i.id} className={`iw-issue ${view.issueId === i.id ? 'is-selected' : ''} ${i.category === 'citation_mismatch' ? 'is-mismatch' : ''}`}><button className="iw-issue-heading" onClick={() => setView({ issueId: i.id, sourceId: i.relatedEvidence[0]?.sourceId, paragraphId: i.relatedEvidence[0]?.paragraphId })}><span><span className="iw-dot" />{categoryNames[i.category]}</span><span>定位原文 ↗</span></button><p>{i.reason}</p>{i.suggestedRevision && entry.status !== 'excluded' && <button className="iw-text-button" onClick={() => patchEntry({ draft: i.suggestedRevision })}>以建议为修订起点 ↗</button>}</article>)}</div>
              {!issues.length && <div className="iw-neutral-note">{kindFor(project, claim.id) === 'unchecked' ? '尚未导入本条的 AI 审阅结果。你可以先关联原文，进行人工审阅。' : '提供范围内未标出疑点。仍需核对原文，并记录判断依据。'}</div>}
              {gaps.map((n, index) => <div className="iw-missing" key={n.id || index}><strong>待补材料 · {n.sourceId} / {n.paragraphId}</strong><p>{n.reason}</p><small>需要：{n.neededMaterial || '补齐对应来源与段落'}</small><button className="iw-text-button" onClick={() => openMaterial(n)}>补充对应原文 ↗</button></div>)}
              {!gaps.length && project.review.scopeNotices.some(n => n.targetId === claim.id) && <p className="iw-neutral-note">原先缺失的材料已补充。请核对原文后判断，AI 审阅尚未重新运行。</p>}
              {entry.draft !== null ? <div className="iw-edit-area"><label htmlFor="iw-draft">修订结论</label><textarea id="iw-draft" rows="5" value={entry.draft} onChange={e => patchEntry({ draft: e.target.value })} /><div className="iw-actions"><button className="iw-button iw-primary" onClick={saveEdit}>保存修订</button><button className="iw-button" onClick={() => patchEntry({ draft: null })}>取消</button></div></div> : entry.status !== 'excluded' && <button className="iw-button iw-edit-button" onClick={() => patchEntry({ draft: entry.text })}>修改结论 <span>↗</span></button>}
              <div className="iw-review-note"><label htmlFor="iw-note">我的判断依据 <span>确认或排除前填写</span></label><textarea id="iw-note" rows="3" placeholder="结合原文，记录保留、修订或排除的理由…" value={entry.note} disabled={entry.status === 'excluded'} onChange={e => patchEntry({ note: e.target.value })} onBlur={() => {
                const last = project.history.filter(h => h.targetId === claim.id).at(-1)
                if (entry.note && entry.note !== last?.note) patchEntry({}, '更新判断依据')
              }} /></div>
              <div className="iw-review-actions">{entry.status === 'excluded' ? <button className="iw-button" onClick={() => patchEntry({ status: entry.text === claim.text ? 'pending' : 'edited' }, '恢复结论')}>恢复为待审阅</button> : <><button className="iw-button iw-primary" onClick={confirm} disabled={entry.status === 'confirmed' || gaps.length > 0}>{gaps.length ? '待补材料，暂不能确认' : entry.status === 'confirmed' ? '✓ 已确认当前版本' : '确认当前版本'}</button><button className="iw-text-button iw-exclude" onClick={exclude} disabled={entry.draft !== null}>排除此条</button></>}</div>
              <p className="iw-feedback" role="status" aria-live="polite">{feedback}</p><p className="iw-review-hint">提示帮助你定位疑点，最终判断由你完成。</p>
            </div>
          </section>
          <section className="iw-source-pane" aria-label="对应原文"><div className="iw-panel-heading"><span>对应原文</span><span>{required.filter(k => entry.seen.includes(k)).length} / {required.length} 已核对</span></div><div className="iw-source-controls"><label htmlFor="iw-source">访谈材料</label><select id="iw-source" value={source?.sourceId || ''} onChange={e => setView({ sourceId: e.target.value, paragraphId: '', issueId: null })}>{project.sources.map(s => <option key={s.sourceId} value={s.sourceId}>{s.sourceId} · {s.participantId || '受访者未标识'}</option>)}</select>{source && <p>{project.sources.filter(s => s.participantId && s.participantId === source.participantId).length > 1 ? '同一受访者含多份材料，人数去重统计。' : '点击段落可关联到当前判断。'}</p>}</div>
            <div className="iw-source-paragraphs">{source?.paragraphs.map(p => {
              const key = `${source.sourceId}|${p.id}`, related = required.includes(key), seen = entry.seen.includes(key)
              const ref = (selectedIssue?.relatedEvidence || refs).find(e => e.sourceId === source.sourceId && e.paragraphId === p.id)
              const quoteExists = !ref?.quote || p.text.includes(ref.quote)
              return <article key={p.id} ref={el => { paragraphRefs.current[p.id] = el }} className={`iw-paragraph ${p.id === paragraphId ? 'is-focused' : ''} ${related ? 'is-related' : ''}`}><div className="iw-paragraph-heading"><span>{p.id}</span>{ref && <small>{relationNames[ref.relation]}</small>}</div><p><Quoted text={p.text} quote={ref?.quote} /></p>{ref?.quote && !quoteExists && <div className="iw-quote-mismatch">指定引文未在此段逐字出现，请对照原始文字。</div>}<div className="iw-paragraph-actions">{related ? <><label><input type="checkbox" checked={seen} disabled={entry.status === 'excluded'} onChange={() => toggleSeen(key)} /> 已核对原文</label>{entry.selectedRefs.includes(key) && <button className="iw-text-button" onClick={() => toggleEvidence(key)} disabled={entry.status === 'excluded'}>移除关联</button>}</> : <button className="iw-text-button" onClick={() => toggleEvidence(key)} disabled={entry.status === 'excluded'}>＋ 关联为判断依据</button>}</div></article>
            })}{!source && <div className="iw-source-empty">当前没有可读取的原文。导入时请包含 sources 与 paragraphs。</div>}</div>
          </section>
        </div>}
        {tab === 'matrix' && <section className="iw-matrix"><div className="iw-view-heading"><div><h2>把结论放回每一份材料中</h2><p>证据关系来自原始结论的审阅，修订后尚未重算。空白表示未建立关联，不代表反对。</p></div><div className="iw-legend">{['supports', 'contradicts', 'limits', 'no_position'].map(key => <span key={key}><i className={`iw-relation-dot is-${key}`} />{relationNames[key]}</span>)}</div></div><div className="iw-table-scroll"><table><thead><tr><th>研究结论</th>{project.sources.map(s => <th key={s.sourceId}>{s.sourceId}<small>{s.participantId || '未标识'}</small></th>)}<th>审阅状态</th></tr></thead><tbody>{project.claims.map(c => <tr key={c.id}><th><button onClick={() => selectClaim(c, { tab: 'review' })}><span>{c.id}</span>{entryFor(project, c.id).text}</button>{entryFor(project, c.id).text !== c.text && <small className="iw-matrix-version">已修订 · 关系仍针对原始版本</small>}{gapsFor(project, c.id).length > 0 && <small className="iw-matrix-gap">待补：{gapsFor(project, c.id).map(g => g.sourceId).join("、")}</small>}</th>{project.sources.map(s => {
          const matches = refsFor(project, c.id).filter(e => e.sourceId === s.sourceId && locate(project, e))
          const manual = entryFor(project, c.id).selectedRefs.filter(k => k.startsWith(s.sourceId + '|')).map(k => ({ paragraphId: k.split('|')[1], relation: 'reference' }))
          const all = [...matches, ...manual]
          const relations = [...new Set(all.map(e => e.relation))]
          return <td key={s.sourceId}>{relations.length ? <button className="iw-matrix-cell" aria-label={`${c.id} ${s.sourceId} ${relations.map(r => relationNames[r]).join('、')}`} onClick={() => selectClaim(c, { tab: 'review', sourceId: s.sourceId, paragraphId: all[0].paragraphId })}>{relations.map(r => <span className={`iw-relation is-${r}`} key={r}>{relationNames[r]}</span>)}</button> : <span className="iw-no-relation">—</span>}</td>
        })}<td><span className={`iw-mini-status is-${entryFor(project, c.id).status}`}>{statusNames[entryFor(project, c.id).status]}</span></td></tr>)}</tbody></table></div><div className="iw-matrix-footer">材料关联按文件展示；受访者人数按 participantId 去重。当前 {project.sources.length} 份材料对应 {participants.length} 位已标识受访者。</div></section>}
        {tab === 'history' && <section className="iw-history"><div className="iw-view-heading"><div><h2>判断是怎样形成的</h2><p>记录修改、原文核对和最终取舍，保留每一步依据。</p></div><button className="iw-button" onClick={exportReport}>导出审阅报告 ↗</button></div>{!project.history.length ? <div className="iw-history-empty"><span>↺</span><h3>还没有审阅记录</h3><p>核对原文、保存修订或确认结论后，记录会出现在这里。</p><button className="iw-text-button" onClick={() => setView({ tab: 'review' })}>开始审阅 ↗</button></div> : <ol className="iw-timeline">{[...project.history].reverse().map(h => <li key={h.id}><time>{stamp(h.at)}</time><div><div className="iw-history-title"><button onClick={() => { const c = project.claims.find(c => c.id === h.targetId); if (c) selectClaim(c, { tab: 'review' }) }}>{h.targetId}</button><strong>{h.action}</strong><span>{statusNames[h.status]}</span></div>{h.before !== h.after && <div className="iw-diff"><p><span>修改前</span>{h.before}</p><p><span>修改后</span>{h.after}</p></div>}{h.note && <p className="iw-history-note">依据：{h.note}</p>}</div></li>)}</ol>}</section>}
      </>}
      <footer className="iw-footer"><span>InsightLens <span>·</span> 从分析草稿，到有据可查的研究判断</span><span>本地工作台 / 预览版</span></footer>
    </div>
    <dialog ref={dialogRef} className="iw-dialog" onCancel={() => setDialog(null)} onClick={e => { if (e.target === e.currentTarget) setDialog(null) }}><div className="iw-dialog-heading"><h2>{dialog === 'create' ? '新建研究项目' : dialog === 'import' ? '导入研究包' : dialog === 'source' ? '补充缺失的原文' : '带走研究与判断'}</h2><button aria-label="关闭对话框" onClick={() => setDialog(null)}>×</button></div>
      {dialog === 'create' && <form onSubmit={createProject}><label>项目名称<input autoFocus required value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="例如：预约体验研究" /></label><label>研究问题<textarea rows="3" value={question} onChange={e => setQuestion(e.target.value)} placeholder="这次研究希望弄清楚什么？" /></label><p className="iw-dialog-note">项目独立保存材料、结论与审阅记录。创建后可导入已有分析。</p><button className="iw-button iw-primary" type="submit">创建项目</button></form>}
      {dialog === 'import' && <form onSubmit={importProject}><p className="iw-dialog-intro">将 Skill 的分析结果与原文放在一起，继续对照和审阅。空项目会接入材料；已有材料时创建独立项目。</p><label>项目名称（可选）<input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="沿用导入文件的项目名称" /></label><label className="iw-file-drop">选择 JSON 文件<input type="file" accept=".json,application/json" multiple onChange={e => setImportFiles([...e.target.files])} /><small>选择研究输入与审阅结果两份文件，或一份合并研究包 / 网页项目备份。每份不超过 5 MB。</small></label><details className="iw-format-help"><summary>查看导入格式与示例</summary><p>研究输入包含 sources（sourceId、participantId、paragraphs）及 claims（id、text）。审阅结果采用 Skill 的 issues、scopeNotices 与 reviewedTargets 格式。仅有 Markdown 报告时，可让 AI 按该结构转换后导入。</p><button className="iw-text-button" type="button" onClick={downloadExample}>下载完整合成研究包 ↗</button><a href={`${SKILL_URL}/tree/main/examples/meeting-review`} target="_blank" rel="noreferrer">查看 Skill 示例 ↗</a></details>{importError && <p className="iw-import-error" role="alert">{importError}</p>}<button className="iw-button iw-primary" type="submit">导入并打开项目</button></form>}
      {dialog === 'source' && <form onSubmit={addMaterial}><p className="iw-dialog-intro">保留来源与段落编号，将对应原文补进当前项目。补充后需要重新核对结论。</p><label>来源 / 段落<input readOnly value={`${material.sourceId} / ${material.paragraphId}`} /></label><label>受访者编号<input value={material.participantId} onChange={e => setMaterial(m => ({ ...m, participantId: e.target.value }))} placeholder="例如 U14；同一人的追访使用同一编号" /></label><label>段落原文<textarea required rows="5" value={material.text} onChange={e => setMaterial(m => ({ ...m, text: e.target.value }))} placeholder="粘贴对应段落，保留原始表述" /></label>{importError && <p className="iw-import-error" role="alert">{importError}</p>}<button className="iw-button iw-primary" type="submit">补充并核对原文</button></form>}
      {dialog === 'export' && <div className="iw-export-options"><p>导出「{project.name}」的当前状态。</p><button onClick={exportReport}><span className="iw-file-type">MD</span><span><strong>审阅报告</strong><small>结论、原文、疑点、判断依据及审阅记录</small></span><span>↓</span></button><button onClick={exportBackup}><span className="iw-file-type">JSON</span><span><strong>完整项目备份</strong><small>保留原文、修订、状态和未保存草稿，可重新导入恢复</small></span><span>↓</span></button><p className="iw-dialog-note">浏览器缓存可能被清理。项目备份可用于恢复，报告适合阅读和分享。</p></div>}
    </dialog>
  </div>
}
