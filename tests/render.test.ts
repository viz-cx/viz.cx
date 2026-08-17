import { describe, it, expect } from 'vitest'
import { renderBlocks, escapeHtml } from '../lib/render'
const doc = (blocks: object[]) => ({ blocks }) as never
describe('renderBlocks', () => {
  it('paragraph passes stored (pre-sanitized) html through', () =>
    expect(renderBlocks(doc([{ type: 'paragraph', data: { text: 'hi <b>x</b>' } }]))).toBe('<p>hi <b>x</b></p>'))
  it('header clamps level to 2..4', () => {
    expect(renderBlocks(doc([{ type: 'header', data: { text: 'T', level: 1 } }]))).toBe('<h2>T</h2>')
    expect(renderBlocks(doc([{ type: 'header', data: { text: 'T', level: 6 } }]))).toBe('<h4>T</h4>')
  })
  it('lists', () =>
    expect(renderBlocks(doc([{ type: 'list', data: { style: 'ordered', items: ['a', 'b'] } }])))
      .toBe('<ol><li>a</li><li>b</li></ol>'))
  it('lists render {content} object items (actual @editorjs/list@2.0.9 saved shape), recursing into nested sub-lists', () =>
    expect(renderBlocks(doc([{ type: 'list', data: { style: 'unordered', items: [
      { content: 'a', items: [] },
      { content: 'b', items: [{ content: 'nested', items: [] }] },
    ] } }])))
      .toBe('<ul><li>a</li><li>b<ul><li>nested</li></ul></li></ul>'))
  it('code is escaped', () =>
    expect(renderBlocks(doc([{ type: 'code', data: { code: '<script>' } }])))
      .toBe('<pre><code>&lt;script&gt;</code></pre>'))
  it('image only from /media/, attrs escaped', () => {
    expect(renderBlocks(doc([{ type: 'image', data: { file: { url: '/media/a.png' }, caption: 'c' } }])))
      .toBe('<figure><img src="/media/a.png" alt="" loading="lazy"><figcaption>c</figcaption></figure>')
    expect(renderBlocks(doc([{ type: 'image', data: { file: { url: 'https://evil/x.png' } } }]))).toBe('')
    expect(renderBlocks(doc([{ type: 'image', data: { file: { url: 'data:image/png;base64,iVBORw0KG' } } }]))).toBe('')
    expect(renderBlocks(doc([{ type: 'image', data: { file: { url: 'javascript:alert(1)' } } }]))).toBe('')
  })
  it('quote, delimiter', () => {
    expect(renderBlocks(doc([{ type: 'quote', data: { text: 'q', caption: 'a' } }])))
      .toBe('<blockquote><p>q</p><cite>a</cite></blockquote>')
    expect(renderBlocks(doc([{ type: 'delimiter', data: {} }]))).toBe('<hr>')
  })
  it('embed only youtube/vimeo hosts', () => {
    const y = renderBlocks(doc([{ type: 'embed', data: { service: 'youtube', embed: 'https://www.youtube.com/embed/dQw4' } }]))
    expect(y).toContain('<iframe src="https://www.youtube.com/embed/dQw4"')
    expect(renderBlocks(doc([{ type: 'embed', data: { service: 'x', embed: 'https://evil/e' } }]))).toBe('')
    expect(renderBlocks(doc([{ type: 'embed', data: { service: 'youtube', embed: 'javascript://youtube.com/%0aalert(1)' } }]))).toBe('')
    expect(renderBlocks(doc([{ type: 'embed', data: { service: 'youtube', embed: 'data:text/html,<script>alert(1)</script>' } }]))).toBe('')
  })
  it('unknown block renders nothing, never throws', () =>
    expect(renderBlocks(doc([{ type: 'wat', data: {} }, { type: 'paragraph', data: { text: 'x' } }]))).toBe('<p>x</p>'))
})
it('escapeHtml', () => expect(escapeHtml('<a b="c">&')).toBe('&lt;a b=&quot;c&quot;&gt;&amp;'))
