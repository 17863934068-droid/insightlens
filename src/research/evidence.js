function indexedText(text) {
  let normalized = ''
  const positions = []
  for (let i = 0; i < text.length; i++) {
    if (/\s/u.test(text[i])) continue
    normalized += text[i]
    positions.push(i)
  }
  return { normalized, positions }
}
function matchRange(text, quote) {
  if (typeof quote !== 'string' || !quote.trim()) return null
  const wanted = quote.replace(/\s/gu, '')
  const { normalized, positions } = indexedText(text)
  const at = normalized.indexOf(wanted)
  return at < 0 ? null : [positions[at], positions[at + wanted.length - 1] + 1]
}
export function linkEvidence(sources, quote, target) {
  const found = []
  for (const source of sources) {
    if (target?.sourceId && target.sourceId !== source.sourceId) continue
    const paragraphs = source.paragraphs.filter(p => !target?.paragraphId || target.paragraphId === p.id)
    const direct = paragraphs.flatMap(p => {
      const range = matchRange(p.text, quote)
      return range ? [{ sourceId: source.sourceId, paragraphId: p.id, quote: p.text.slice(...range), relation: 'reference' }] : []
    })
    if (direct.length) { found.push(...direct); continue }
    if (target?.paragraphId) continue
    const fullText = paragraphs.map(p => p.text).join('\n\n')
    const range = matchRange(fullText, quote)
    if (!range) continue
    let offset = 0
    for (const paragraph of paragraphs) {
      const start = Math.max(range[0], offset), end = Math.min(range[1], offset + paragraph.text.length)
      if (end > start) {
        const original = paragraph.text.slice(start - offset, end - offset)
        if (original.trim()) found.push({ sourceId: source.sourceId, paragraphId: paragraph.id, quote: original, relation: 'reference' })
      }
      offset += paragraph.text.length + 2
    }
  }
  return found
}
