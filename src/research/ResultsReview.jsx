import { useEffect, useRef, useState } from 'react'
import { normalizeBundle, entryFor, refsFor, evidenceKeys, gapsFor, updateEntry, confirmError, exportProject, parseBackup, reportMarkdown, categoryNames } from './model.js'
import { sections, englishSections } from './result-adapter.js'
import './results-review.css'

const SITE_REVIEW_KEY = 'insightlens-site-review-v1'
const labels = { pending: '待审阅', edited: '已修改 · 待核对', confirmed: '已确认', excluded: '已排除' }
const englishLabels = { pending: 'Pending', edited: 'Edited · Review needed', confirmed: 'Confirmed', excluded: 'Excluded' }
function createProject(bundle) {
  if (bundle.backup) return { ...parseBackup(bundle.backup), id: bundle.backup.project.id }
  try { return normalizeBundle(bundle.input, bundle.review, '访谈研究') }
  catch { return { ...normalizeBundle(bundle.input, {}, '访谈研究'), reviewUnavailable: true } }
}
function saveDownload(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
function Highlight({ text, spans = [] }) {
  const valid = [...new Set(spans.filter(s => s && text.includes(s)))].sort((a, b) => b.length - a.length)
  if (!valid.length) return text
  const parts = []; let position = 0
  while (position < text.length) {
    const matches = valid.map(span => ({ span, at: text.indexOf(span, position) })).filter(m => m.at >= 0).sort((a, b) => a.at - b.at)
    if (!matches.length) { parts.push(text.slice(position)); break }
    const { at, span } = matches[0]
    parts.push(text.slice(position, at)); parts.push(<mark key={`${at}-${span}`}>{span}</mark>); position = at + span.length
  }
  return parts
}
export default function ResultsReview({ bundle, lang, onProjectChange, onFindEvidence, projectName, researchQuestion, onExportProject }) {
  if (!bundle) return <p className="rr-processing">{lang === 'zh' ? '正在整理分析结论与原文…' : 'Linking conclusions to sources…'}</p>
  return <ReviewContent bundle={bundle} lang={lang} onProjectChange={onProjectChange} onFindEvidence={onFindEvidence} projectName={projectName} researchQuestion={researchQuestion} onExportProject={onExportProject} />
}
function ReviewContent({ bundle, lang, onProjectChange, onFindEvidence, projectName, researchQuestion, onExportProject }) {
  const [project, setProject] = useState(() => createProject(bundle))
  const [selectedId, setSelectedId] = useState(() => project.claims[0]?.id)
  const [category, setCategory] = useState('all')
  const [filter, setFilter] = useState('all')
  const [location, setLocation] = useState(null)
  const [message, setMessage] = useState('')
  const [saveState, setSaveState] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkMessage, setLinkMessage] = useState('')
  const sourcePane = useRef(null)
  const zh = lang === 'zh'
  const tr = (cn, en) => zh ? cn : en
  const names = zh ? labels : englishLabels
  const unlinked = project.claims.filter(c => !evidenceKeys(project, c.id).length)
  async function completeLinks() {
    if (linking || !onFindEvidence) return
    setLinking(true); setLinkMessage('')
    try {
      const input = { sources: project.sources, claims: unlinked.map(c => ({ ...c, text: entryFor(project, c.id).text })) }
      const grounded = await onFindEvidence(input)
      const matched = grounded.claims.filter(c => c.citations.length)
      setProject(current => {
        const updated = { ...current, claims: [...current.claims], entries: { ...current.entries }, history: [...current.history] }
        for (const row of matched) {
          const index = updated.claims.findIndex(c => c.id === row.id)
          if (index < 0 || entryFor(current, row.id).text !== row.text || evidenceKeys(current, row.id).length) continue
          updated.claims[index] = { ...updated.claims[index], citations: row.citations }
          const entry = entryFor(current, row.id)
          if (entry.status === 'confirmed') updated.entries[row.id] = { ...entry, status: 'pending' }
          updated.history.push({ id: crypto.randomUUID(), targetId: row.id, action: '补全原文关联', at: new Date().toISOString() })
        }
        return updated
      })
      setLinkMessage(tr(`已为 ${matched.length} 条结论补全关联${matched.length < unlinked.length ? '，其余未找到可核验引文。' : '。'}`, `Linked ${matched.length} conclusions. Remaining items need source verification.`))
    } catch (error) { setLinkMessage(error.message) }
    finally { setLinking(false) }
  }
  const groupFor = c => Object.keys(sections).find(k => c.id.startsWith(`${k}-`)) || (project.synthetic ? ({ R01: 'themes', R02: 'themes', R05: 'painPoints', R07: 'painPoints', R08: 'painPoints', R10: 'themes' }[c.id] || 'insights') : 'insights')
  const visible = project.claims.filter(c => (category === 'all' || groupFor(c) === category) && (filter === 'all' || entryFor(project, c.id).status === filter))
  const claim = visible.find(c => c.id === selectedId) || visible[0]
  const selected = claim?.id
  const entry = claim ? entryFor(project, selected) : null
  const refs = selected ? refsFor(project, selected) : []
  const required = selected ? evidenceKeys(project, selected) : []
  const issues = project.review.issues.filter(i => i.targetId === selected)
  const sourceId = location?.claimId === selected ? location.sourceId : refs[0]?.sourceId || project.sources[0]?.sourceId
  const activeParagraph = location?.claimId === selected ? location.paragraphId : refs[0]?.paragraphId
  const source = selected ? project.sources.find(s => s.sourceId === sourceId) : null
  useEffect(() => {
    if (onProjectChange) { onProjectChange(exportProject(project)); return }
    const timer = setTimeout(() => {
      try { localStorage.setItem(SITE_REVIEW_KEY, JSON.stringify(exportProject(project))); setSaveState('saved') }
      catch { setSaveState('failed') }
    }, 400)
    return () => clearTimeout(timer)
  }, [project, onProjectChange])
  useEffect(() => {
    if (!sourcePane.current) return
    const node = Array.from(sourcePane.current.querySelectorAll('[data-paragraph]')).find(n => n.dataset.paragraph === activeParagraph)
    const pane = sourcePane.current
    const top = node ? pane.scrollTop + node.getBoundingClientRect().top - pane.getBoundingClientRect().top - 12 : 0
    pane.scrollTo({ top, behavior: 'smooth' })
    if (location && window.matchMedia('(max-width: 760px)').matches) {
      pane.closest('aside')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selected, activeParagraph, sourceId, location])
  function choose(c) { setSelectedId(c.id); setLocation(null); setMessage('') }
  function change(patch, event) { setProject(p => updateEntry(p, selected, patch, event)); setMessage('') }
  function finish(status) {
    if (status === 'confirmed') { const error = confirmError(project, selected); if (error) { setMessage(error); return } }
    change({ status }, status === 'confirmed' ? '确认当前版本' : status === 'excluded' ? '排除结论' : '恢复待审阅')
  }
  function locateRef(r) {
    setLocation({ claimId: selected, sourceId: r.sourceId, paragraphId: r.paragraphId })
  }
  const categories = [['all', tr('全部', 'All')], ...Object.entries(zh ? sections : englishSections).filter(([key]) => project.claims.some(c => groupFor(c) === key))]
  return <div className="rr-root rr-trace-review">
    <div className="rr-summary"><span className="rr-draft-label">{project.synthetic ? tr('展示案例 · 合成', 'Demo case · Synthetic') : tr('AI 分析草稿', 'AI draft')}</span><span className="rr-review-progress">{project.claims.filter(c => entryFor(project, c.id).status === 'confirmed').length} / {project.claims.length} {tr('已确认', 'confirmed')}</span><details className="rr-help"><summary>{tr('审阅说明', 'Review guidance')}</summary><p>{project.synthetic ? tr('预设的合成示例。选择结论查看关联原文，核对后确认，也可自行修改。', 'A preset synthetic example. Select a conclusion to inspect its sources, then confirm or edit.') : tr('选择结论查看关联原文，核对后确认，也可修改或排除。AI 草稿与辅助提示均需由你判断。', 'Select a conclusion to inspect its sources, then confirm, edit or exclude. AI drafts and optional review cues need your judgment.')}</p></details></div>
    {saveState === 'failed' && <p className="rr-alert">{tr('保存失败，请导出备份。', 'Save failed. Export a backup.')}</p>}
    {(unlinked.length > 0 || linkMessage) && <div className="rr-linking-summary" role="status">{unlinked.length > 0 && <span>{tr(`${unlinked.length} 条结论待关联原文`, `${unlinked.length} conclusions need sources`)}</span>}{unlinked.length > 0 && onFindEvidence && <button className="rr-text-button" onClick={completeLinks} disabled={linking}>{linking ? tr('正在关联…', 'Linking…') : tr('补全原文关联', 'Find source links')}</button>}{linkMessage && <span>{linkMessage}</span>}</div>}
    <div className="rr-toolbar"><div className="rr-facets" aria-label={tr('结果类别', 'Result category')}>{categories.map(([key, label]) => <button key={key} aria-pressed={category === key} onClick={() => { setCategory(key); setMessage(''); setLocation(null) }}>{label}<span>{key === 'all' ? project.claims.length : project.claims.filter(c => groupFor(c) === key).length}</span></button>)}</div><select aria-label={tr('筛选审阅状态', 'Filter review status')} value={filter} onChange={e => { setFilter(e.target.value); setMessage(''); setLocation(null) }}><option value="all">{tr('全部状态', 'All statuses')}</option><option value="pending">{tr('待审阅', 'Pending')}</option><option value="edited">{tr('已修改', 'Edited')}</option><option value="confirmed">{tr('已确认', 'Confirmed')}</option><option value="excluded">{tr('已排除', 'Excluded')}</option></select></div>
    <div className="rr-workarea"><div className="rr-conclusions"><h3 className="rr-column-title">{tr('分析结论', 'Conclusions')}</h3><div className="rr-card-grid">{visible.map(c => {
      const e = entryFor(project, c.id), isSelected = c.id === selected
      const lines = e.text.trim().split('\n').filter(line => line.trim())
      const categoryLabel = (zh ? sections : englishSections)[groupFor(c)]
      const title = lines.length > 1 ? lines[0] : categoryLabel
      const body = lines.length > 1 ? lines.slice(1).join('\n') : e.text
      return <article key={c.id} className={`rr-claim ${isSelected ? 'is-selected' : ''}`}>
        <button className="rr-card" aria-pressed={isSelected} onClick={() => choose(c)}><div className="rr-card-top"><span>{lines.length > 1 ? categoryLabel : ''}</span><span className={`rr-status is-${e.status}`}>{names[e.status]}</span></div><h4 className="rr-conclusion-title">{title}</h4><p className="rr-conclusion-body">{body}</p></button>
        {isSelected && <section className="rr-detail" aria-label={tr('当前结论审阅', 'Selected conclusion review')}>
          <div className="rr-citations">{refs.filter((r, i, rows) => rows.findIndex(v => v.sourceId === r.sourceId && v.paragraphId === r.paragraphId) === i).map((r, i) => <button className="rr-citation" key={`${r.sourceId}|${r.paragraphId}`} onClick={() => locateRef(r)}>{tr(`查看原文 ${i + 1} ↗`, `Source ${i + 1} ↗`)}</button>)}</div>
          {gapsFor(project, selected).map((g, i) => <p className="rr-alert" key={i}>{tr('原文待补充：', 'Source needed: ')}{g.reason}</p>)}
          {!refs.length && <p className="rr-alert">{tr('自动定位未找到匹配引文，请核对后补充关联。', 'No matching quote was found automatically. Check the source and add a link.')}</p>}
          {issues.length > 0 && <details className="rr-legacy-issues"><summary>{tr(`辅助提示（${issues.length}）`, `Optional review cues (${issues.length})`)}</summary>{issues.map(i => <div className="rr-legacy-issue" key={i.id}><strong>{categoryNames[i.category]}</strong><p>{i.reason}</p>{i.suggestedRevision && <button className="rr-text-button" onClick={() => change({ draft: i.suggestedRevision })}>{tr('参考建议修改', 'Edit from suggestion')}</button>}</div>)}</details>}
          {e.draft !== null ? <div className="rr-edit"><label>{tr('修改结论', 'Edit conclusion')}<textarea aria-label={tr('修订草稿', 'Revision draft')} value={e.draft} onChange={event => change({ draft: event.target.value })} /></label><div><button className="btn-primary" onClick={() => { if (!e.draft.trim()) { setMessage(tr('结论不能为空。', 'Conclusion cannot be empty.')); return }; change({ text: e.draft, draft: null, status: 'edited' }, '保存修订') }}>{tr('保存修改', 'Save revision')}</button><button className="btn-ghost" onClick={() => change({ draft: null })}>{tr('取消', 'Cancel')}</button></div></div> : <div className="rr-inline-actions"><button className="rr-text-button" onClick={() => change({ draft: e.text })}>{tr('修改结论', 'Edit conclusion')}</button>{e.status !== 'excluded' && <button className="rr-text-button" onClick={() => finish('excluded')}>{tr('排除此条', 'Exclude')}</button>}</div>}
          <details className="rr-note-disclosure"><summary>{tr('补充判断（选填）', 'Add reasoning (optional)')}</summary><textarea aria-label={tr('我的判断依据', 'My reasoning')} placeholder={tr('记录你的判断，方便之后回看', 'Record your reasoning for later')} value={e.note} onChange={event => change({ note: event.target.value })} /></details>
          <div className="rr-decisions"><span className="rr-check-progress">{required.filter(k => e.seen.includes(k)).length}/{required.length} {tr('段原文已核对', 'sources checked')}</span>{e.status === 'excluded' ? <button className="btn-ghost" onClick={() => finish('pending')}>{tr('恢复待审阅', 'Restore to pending')}</button> : e.status === 'confirmed' ? <span className="rr-confirmed-label">{tr('已确认', 'Confirmed')}</span> : <button className="btn-primary" onClick={() => finish('confirmed')}>{tr('确认结论', 'Confirm conclusion')}</button>}</div>
          {message && <p className="rr-feedback" role="status">{message}</p>}
        </section>}
      </article>
    })}</div>{!visible.length && <p className="rr-empty">{tr('没有符合筛选条件的结论。', 'No conclusions match this filter.')}</p>}</div>
    <aside className="rr-source-column" aria-label={tr('原文对照', 'Source comparison')}><h3 className="rr-column-title">{tr('关联原文', 'Source transcript')}</h3><div className="rr-source"><div className="rr-source-header">{project.sources.length > 1 && <select aria-label={tr('选择访谈原文', 'Select transcript')} value={sourceId || ''} onChange={e => setLocation({ claimId: selected, sourceId: e.target.value, paragraphId: '' })}>{project.sources.map((s, i) => <option key={s.sourceId} value={s.sourceId}>{s.name || tr(`资料 ${i + 1}`, `Material ${i + 1}`)}</option>)}</select>}<p>{source && [source.role, source.date, source.method].filter(Boolean).join(' · ')}</p></div>
      <div className="rr-source-body" ref={sourcePane}>{source?.paragraphs.map((p, index) => {
        const key = `${source.sourceId}|${p.id}`, related = refs.filter(r => r.sourceId === source.sourceId && r.paragraphId === p.id), linked = required.includes(key)
        return <article key={p.id} data-paragraph={p.id} className={`${linked ? 'is-related' : ''} ${p.id === activeParagraph ? 'is-located' : ''}`}><div className="rr-paragraph-meta"><span>{tr(`段落 ${index + 1}`, `Paragraph ${index + 1}`)}</span>{linked && <span>{tr('关联原文', 'Linked source')}</span>}</div><p><Highlight text={p.text} spans={related.map(r => r.quote)} /></p>{related.some(r => r.quote && !p.text.includes(r.quote)) && <small className="rr-mismatch">{tr('引文未逐字匹配，请检查原话。', 'Quote does not match verbatim. Check the source.')}</small>}{entry && (linked ? <label className="rr-check"><input type="checkbox" checked={entry.seen.includes(key)} onChange={e => change({ seen: e.target.checked ? [...new Set([...entry.seen, key])] : entry.seen.filter(k => k !== key) }, '核对原文')} />{tr('已核对这段原文', 'I checked this paragraph')}</label> : <button className="rr-link-source" onClick={() => change({ selectedRefs: [...new Set([...entry.selectedRefs, key])] }, '关联原文')}>{tr('＋ 关联到这条结论', '+ Link to this conclusion')}</button>)}</article>
      })}{!source && <p className="rr-empty">{tr('选择一条结论查看原文。', 'Select a conclusion to view its source.')}</p>}</div>
    </div></aside></div>
    <details className="rr-history"><summary>{tr('修改记录', 'Revision history')} <span>{project.history.length}</span></summary>{project.history.slice().reverse().map(h => <article key={h.id}><header><strong>{h.action || h.type}</strong><span>{h.claimId || h.targetId} · {new Date(h.at || h.timestamp).toLocaleString()}</span></header>{h.before && h.after && h.before !== h.after && <><del>{h.before}</del><p>{h.after}</p></>}{h.note && <p>{h.note}</p>}</article>)}</details>
    <div className="rr-export"><div><button className="btn-ghost" onClick={() => onExportProject ? onExportProject() : saveDownload('InsightLens-审阅备份.json', JSON.stringify(exportProject(project), null, 2), 'application/json')}>{tr(onExportProject ? '备份整个项目' : '导出审阅备份', onExportProject ? 'Back up entire project' : 'Export review backup')}</button><button className="btn-primary" onClick={() => saveDownload('InsightLens-审阅报告.md', reportMarkdown({ ...project, name: projectName || project.name, researchQuestion: researchQuestion || project.researchQuestion }), 'text/markdown;charset=utf-8')}>{tr('导出研究报告 ↗', 'Export research report ↗')}</button></div></div>
  </div>
}
