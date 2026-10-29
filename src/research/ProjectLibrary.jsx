import { useEffect, useRef, useState } from 'react'
import './project-library.css'
export default function ProjectLibrary({ preview = false, onExitPreview, library, active, onSelect, onCreate, onDelete, onRestore, onUpdate, onSave, onExport, onImport, disabled, saveStatus, loadError, lang }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(null)
  const [showTrash, setShowTrash] = useState(false)
  const [notice, setNotice] = useState(null)
  const nameInput = useRef(null)
  const creating = draft !== null
  const fields = draft || active
  useEffect(() => {
    if (creating) nameInput.current?.focus()
  }, [creating])
  function updateFields(patch) {
    if (creating) setDraft(previous => ({ ...previous, ...patch }))
    else onUpdate(patch)
  }
  const t = (cn, en) => lang === 'zh' ? cn : en
  const projects = library.projects.filter(p => !p.deletedAt)
  const trash = library.projects.filter(p => p.deletedAt)
  const visible = (showTrash ? trash : projects).filter(p => [p.name, p.topic, p.question, ...p.transcripts.flatMap(tr => [tr.name, tr.role])].join(' ').toLowerCase().includes(query.toLowerCase()))
  function remove(p) { onDelete(p.id); setNotice({ id: p.id, name: p.name || t('未命名研究', 'Untitled research') }) }
  return <section className="pl-root pl-refined" id="research-projects" aria-label={t('访谈项目', 'Interview projects')}>
    <div className="pl-library-panel">
      <header className="pl-heading"><div><h2>{creating ? t('新建访谈项目', 'New interview project') : preview ? t('示例预览', 'Example preview') : t('访谈项目', 'Interview project')}</h2></div>{!creating && <div className="pl-header-actions">{preview && <button className="pl-text-action" disabled={disabled} onClick={onExitPreview}>{t('退出示例', 'Exit example')}</button>}<button className="pl-text-action" disabled={disabled || creating} onClick={() => { setExpanded(!expanded); setShowTrash(false); setQuery('') }} aria-expanded={expanded}>{t(`切换项目 (${projects.length})`, `Switch project (${projects.length})`)} ⌄</button><button className="btn-ghost" disabled={disabled || creating} onClick={() => { setExpanded(false); setDraft({ name: '', topic: '', question: '' }); setNotice(null) }}>{t('＋ 新建访谈', '+ New interview')}</button></div>}</header>
      {loadError && <p className="pl-warning" role="alert">{loadError}</p>}
      {notice && <div className="pl-delete-notice" role="status"><span>{t(`“${notice.name}”已移入回收站。`, `“${notice.name}” moved to trash.`)}</span><button disabled={disabled} onClick={() => { onRestore(notice.id); setNotice(null); setShowTrash(false) }}>{t('撤销删除', 'Undo deletion')}</button><button aria-label={t('关闭删除提示', 'Dismiss deletion notice')} onClick={() => setNotice(null)}>×</button></div>}
      {expanded && <div className="pl-library-controls"><input aria-label={t('搜索项目、主题或角色', 'Search projects, topics or roles')} placeholder={t('搜索项目、主题或角色…', 'Search projects, topics or roles…')} value={query} onChange={e => { setQuery(e.target.value); setExpanded(true) }} /><button className="pl-text-action" onClick={() => { setShowTrash(!showTrash); setExpanded(true); setQuery('') }} aria-pressed={showTrash}>{showTrash ? t('返回项目', 'Back to projects') : t(`回收站${trash.length ? ` (${trash.length})` : ''}`, `Trash (${trash.length})`)}</button></div>}
      {expanded && <div className="pl-project-list">{visible.map(p => <div className={`pl-project-row ${p.id === active.id && !showTrash ? 'is-active' : ''}`} key={p.id}>
        <button className="pl-row-select" disabled={disabled || showTrash} onClick={() => { onSelect(p.id); setExpanded(false) }} aria-pressed={p.id === active.id && !showTrash}><span className="pl-row-title">{p.name || t('未命名研究', 'Untitled research')}{p.id === active.id && !showTrash && <small>{t('当前', 'Current')}</small>}</span><span className="pl-row-meta">{p.topic || t('未填写主题', 'No topic')} · {p.transcripts.filter(tr => tr.content.trim()).length} {t('份原稿', 'transcripts')}</span></button>
        <span className="pl-row-status">{showTrash ? t('已删除', 'Deleted') : p.reviewBundle ? t('已有分析', 'Analyzed') : t('草稿', 'Draft')}</span>
        {showTrash ? <button className="pl-text-action" disabled={disabled} onClick={() => { onRestore(p.id); setShowTrash(false); setNotice(null) }} aria-label={t(`恢复项目：${p.name || '未命名研究'}`, `Restore project: ${p.name || 'Untitled'}`)}>{t('恢复', 'Restore')}</button> : <button className="pl-row-delete" disabled={disabled} onClick={() => remove(p)} aria-label={t(`删除项目：${p.name || '未命名研究'}`, `Delete project: ${p.name || 'Untitled'}`)}>{t('删除', 'Delete')}</button>}
      </div>)}{!visible.length && <p className="pl-empty">{showTrash ? t('回收站为空。删除的项目会保留在这里，可随时恢复。', 'Trash is empty. Deleted projects can be restored here.') : t('没有找到匹配的项目。', 'No matching projects.')}</p>}</div>}
    </div>
    <form className="pl-editor-panel" id="research-project-details" onSubmit={e => { e.preventDefault(); if (!creating || !draft.name.trim()) return; onCreate({ name: draft.name.trim(), topic: draft.topic.trim(), question: draft.question.trim() }); setDraft(null); setExpanded(false) }}>
      <fieldset disabled={disabled} className="pl-fields"><label>{t('项目名称', 'Project name')}<input className={fields.name === '未命名研究' ? 'is-placeholder' : undefined} required={creating} ref={nameInput} aria-label={t('项目名称', 'Project name')} placeholder={t('例如：会议纪要工具体验研究', 'e.g. Meeting notes research')} value={fields.name} onChange={e => updateFields({ name: e.target.value })} /></label><label>{t('研究主题', 'Research topic')}<input aria-label={t('研究主题', 'Research topic')} placeholder={t('这次研究关注什么？', 'What are you researching?')} value={fields.topic} onChange={e => updateFields({ topic: e.target.value })} /></label><label className="pl-question">{t('核心研究问题', 'Key research question')}<textarea aria-label={t('研究目标 / 核心问题', 'Research goal / key questions')} placeholder={t('希望通过访谈了解或验证什么？', 'What would you like to understand or validate?')} value={fields.question} onChange={e => updateFields({ question: e.target.value })} /></label></fieldset>
      {creating ? <footer className="pl-actions pl-create-actions"><span /><div><button type="button" className="btn-ghost" onClick={() => setDraft(null)}>{t('取消', 'Cancel')}</button><button type="submit" className="btn-primary" disabled={disabled || !draft.name.trim()}>{t('创建访谈项目', 'Create interview project')}</button></div></footer> : <footer className="pl-actions"><p role="status" className={saveStatus === 'failed' ? 'pl-save-error' : ''}>{preview ? t('临时示例，不会保存到项目', 'Temporary example, not saved to projects') : saveStatus === 'failed' ? t('保存失败，请备份', 'Save failed. Back up your work.') : saveStatus === 'saved' ? t('已自动保存在此浏览器', 'Autosaved in this browser') : t('正在保存…', 'Saving…')}</p><div>{!preview && <details className="pl-more"><summary>{t('项目操作', 'Project actions')}</summary><div><label className={`pl-import ${disabled ? 'is-disabled' : ''}`}>{t('从备份恢复', 'Restore backup')}<input type="file" accept=".json" disabled={disabled} aria-label={t('导入访谈项目', 'Import interview project')} onChange={onImport} /></label><button type="button" className="pl-text-action" disabled={disabled} onClick={onExport}>{t('备份当前项目', 'Back up project')}</button><button type="button" className="pl-text-action" onClick={onSave} disabled={!!loadError || disabled}>{t('立即保存', 'Save now')}</button><button type="button" className="pl-row-delete" disabled={disabled} onClick={() => remove(active)}>{t('删除当前项目', 'Delete current project')}</button></div></details>}<a className="pl-next" href="#interview-materials">{t('添加文稿 →', 'Add transcripts →')}</a></div></footer>}
    </form>
  </section>
}
