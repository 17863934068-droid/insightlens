// Reconstruct PDF text using layout metadata, without rewriting the transcript.
export async function extractPdfText(file, pdfjs) {
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })
  try {
    const pdf = await loadingTask.promise
    const parts = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      parts.push(pdfPageText((await page.getTextContent()).items))
    }
    const text = parts.filter(Boolean).join('\n\n').trim()
    if (!text) throw new Error('PDF 中没有可提取的文字；扫描件请先转成文字稿。 / No extractable text. Transcribe scanned pages first.')
    return text
  } finally {
    await loadingTask.destroy()
  }
}

export function pdfPageText(items) {
  const lines = []
  let line = '', previous = null, ended = false
  const flush = () => { if (line.trim()) lines.push(line.trim()); line = '' }
  for (const item of items) {
    if (typeof item.str !== 'string') continue
    if (!item.str) { ended ||= !!item.hasEOL; continue }
    const x = item.transform?.[4], y = item.transform?.[5]
    const height = Math.abs(item.height || item.transform?.[3] || 12)
    const gapY = previous && Number.isFinite(y) && Number.isFinite(previous.y) ? Math.abs(y - previous.y) : 0
    if (previous && (ended || gapY > Math.max(height, previous.height) * .4)) {
      flush()
      if (gapY > Math.max(height, previous.height) * 1.6 && lines.at(-1) !== '') lines.push('')
    }
    if (line && previous && Number.isFinite(x) && Number.isFinite(previous.x)) {
      const gap = x - previous.x - previous.width
      const cjkBoundary = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(line) || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(item.str)
      if (gap > height * .15 && !/\s$/.test(line) && !/^\s/.test(item.str) && !cjkBoundary) line += ' '
    }
    line += item.str
    previous = { x, y, height, width: item.width || 0 }
    ended = !!item.hasEOL
  }
  flush()
  return lines.join('\n').replace(/\n(?=(?:访谈员|受访者|采访者|主持人)\s*[:：]|发言人\s*\d+\s+\d{1,2}:\d{2})/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim()
}
