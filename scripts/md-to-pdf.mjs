// Convert an Arabic RTL markdown guide to a styled PDF using Playwright's Chromium.
// Usage: node scripts/md-to-pdf.mjs <input.md> <output.pdf>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const [, , inPath = 'دليل-المشروع.md', outPath = 'دليل-المشروع.pdf'] = process.argv

// ── Tiny markdown → HTML converter (covers the constructs used in the guide) ──

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/«(.+?)»/g, '<span class="q">«$1»</span>')

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0
  let para = []

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`)
      para = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()

    // Horizontal rule
    if (/^---+$/.test(t)) { flushPara(); out.push('<hr>'); i++; continue }

    // Headings
    const h = t.match(/^(#{1,6})\s+(.*)$/)
    if (h) { flushPara(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue }

    // Blank line ends a paragraph
    if (t === '') { flushPara(); i++; continue }

    // Tables
    if (t.startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara()
      const row = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const head = row(lines[i])
      i += 2
      const body = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { body.push(row(lines[i])); i++ }
      const th = head.map((c) => `<th>${inline(c)}</th>`).join('')
      const trs = body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`)
      continue
    }

    // Blockquotes (consecutive > lines)
    if (t.startsWith('>')) {
      flushPara()
      const buf = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(inline(lines[i].trim().replace(/^>\s?/, '')))
        i++
      }
      out.push(`<blockquote>${buf.join('<br>')}</blockquote>`)
      continue
    }

    // Unordered lists (consecutive - lines)
    if (/^[-*]\s+/.test(t)) {
      flushPara()
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // Otherwise accumulate into a paragraph (hard-wrapped lines join together)
    para.push(t)
    i++
  }
  flushPara()
  return out.join('\n')
}

const body = mdToHtml(readFileSync(inPath, 'utf8'))

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Noto Naskh Arabic", "Noto Sans Arabic", "Amiri", "Segoe UI", Tahoma, sans-serif;
    color: #1f2937;
    line-height: 1.9;
    font-size: 13.5px;
    direction: rtl;
    text-align: right;
  }
  h1 {
    font-size: 26px; color: #0f766e; font-weight: 800;
    margin: 0 0 18px; padding-bottom: 14px; border-bottom: 3px solid #0f766e;
  }
  h2 {
    font-size: 19px; color: #0f766e; font-weight: 700;
    margin: 26px 0 12px; padding-right: 12px; border-right: 4px solid #14b8a6;
  }
  h3 {
    font-size: 16px; color: #115e59; font-weight: 700; margin: 20px 0 10px;
  }
  p { margin: 0 0 12px; }
  strong { color: #0f766e; font-weight: 700; }
  em { color: #475569; font-style: normal; font-weight: 600; }
  .q { color: #0d9488; font-weight: 600; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 22px 0; }
  ul { margin: 0 0 14px; padding-right: 22px; }
  li { margin: 0 0 6px; }
  li::marker { color: #14b8a6; }
  table {
    width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 13px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06); border-radius: 8px; overflow: hidden;
  }
  thead th {
    background: #0f766e; color: #fff; font-weight: 700; padding: 10px 12px; text-align: right;
  }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background: #f0fdfa; }
  blockquote {
    margin: 0 0 16px; padding: 14px 16px; background: #f0fdfa;
    border-right: 4px solid #14b8a6; border-radius: 8px; color: #115e59; font-weight: 600;
    line-height: 2.1;
  }
  h2, h3 { break-after: avoid; }
  table, blockquote, ul { break-inside: avoid; }
</style>
</head>
<body>
${body}
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '22mm', bottom: '22mm', left: '18mm', right: '18mm' },
})
await browser.close()
console.log(`✓ PDF written to ${outPath}`)
