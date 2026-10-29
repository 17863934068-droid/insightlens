import test from 'node:test'
import assert from 'node:assert/strict'
import { pdfPageText, extractPdfText } from '../src/research/pdf-text.js'

const item = (str, x, y, width, hasEOL = false) => ({ str, transform: [12, 0, 0, 12, x, y], height: 12, width, hasEOL })
test('PDF import returns extracted text when the document has no destroy method', async () => {
  let released = false
  const document = { numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: [item('访谈原稿', 40, 700, 48)] }) }) }
  const pdfjs = { getDocument: () => ({ promise: Promise.resolve(document), destroy: async () => { released = true } }) }
  assert.equal(await extractPdfText({ arrayBuffer: async () => new ArrayBuffer(0) }, pdfjs), '访谈原稿')
  assert.equal(released, true)
})
test('PDF loading failure still releases its loading task', async () => {
  let released = false
  const pdfjs = { getDocument: () => ({ promise: Promise.reject(new Error('Invalid PDF')), destroy: async () => { released = true } }) }
  await assert.rejects(extractPdfText({ arrayBuffer: async () => new ArrayBuffer(0) }, pdfjs), /Invalid PDF/)
  assert.equal(released, true)
})
test('PDF text retains separate speaker turns and wrapped lines instead of flattening the page', () => {
  const text = pdfPageText([
    item('发言人1 00:00', 40, 700, 90, true),
    item('这是第一行', 40, 682, 60, true),
    item('这是接着的一行。', 40, 664, 96, true),
    item('发言人2 01:03', 40, 646, 90, true),
    item('我需要核对。', 40, 628, 72, true),
  ])
  assert.equal(text, '发言人1 00:00\n这是第一行\n这是接着的一行。\n\n发言人2 01:03\n我需要核对。')
})
test('PDF layout restores unmarked line breaks and paragraph gaps', () => {
  assert.equal(pdfPageText([item('First line.', 40, 700, 60), item('Next line.', 40, 685, 60), item('New paragraph.', 40, 650, 90)]), 'First line.\nNext line.\n\nNew paragraph.')
})
test('PDF text keeps Chinese fragments contiguous and English word spacing', () => {
  assert.equal(pdfPageText([item('会议', 40, 700, 24), item('纪要', 65, 700, 24), item('', 89, 700, 0, true), item('hello', 40, 680, 28), item('world', 72, 680, 30)]), '会议纪要\n\nhello world')
})
test('PDF extraction tolerates non-text markers and empty scanned pages', () => {
  assert.equal(pdfPageText([{ type: 'beginMarkedContent' }, { str: '', hasEOL: true }]), '')
})
