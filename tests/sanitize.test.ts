import { describe, it, expect } from 'vitest'
import { sanitizeInline, sanitizeDoc } from '../lib/sanitize'
describe('sanitizeInline', () => {
  it('keeps allowlist', () => expect(sanitizeInline('<b>x</b> <i>y</i> <mark>z</mark><br/>')).toContain('<b>x</b>'))
  it('strips script', () => expect(sanitizeInline('<script>alert(1)</script>hi')).toBe('hi'))
  it('strips handlers', () => expect(sanitizeInline('<a href="https://x.y" onclick="p()">l</a>')).toBe('<a href="https://x.y">l</a>'))
  it('blocks javascript: URLs', () => expect(sanitizeInline('<a href="javascript:p()">l</a>')).toBe('<a>l</a>'))
})
describe('sanitizeDoc', () => {
  it('sanitizes paragraph/header text, leaves code alone', () => {
    const doc = { blocks: [
      { type: 'paragraph', data: { text: '<img src=x onerror=p()>hi' } },
      { type: 'code', data: { code: '<script>not html</script>' } },
    ] }
    const out = sanitizeDoc(doc)
    expect(out.blocks[0].data.text).toBe('hi')
    expect(out.blocks[1].data.code).toBe('<script>not html</script>') // escaped at render, not here
  })
  it('sanitizes list items and quote', () => {
    const doc = { blocks: [
      { type: 'list', data: { style: 'unordered', items: ['<u>a</u>', '<b>b</b>'] } },
      { type: 'quote', data: { text: '<script>x</script>q', caption: '<b>c</b>' } },
    ] }
    const out = sanitizeDoc(doc)
    expect(out.blocks[0].data.items).toEqual(['a', '<b>b</b>'])
    expect(out.blocks[1].data.text).toBe('q')
  })
  it('sanitizes {content} object list items (actual @editorjs/list@2.0.9 saved shape), recursing into nested items', () => {
    const doc = { blocks: [
      { type: 'list', data: { style: 'unordered', items: [
        { content: '<script>alert(1)</script>a', items: [] },
        { content: '<b>b</b>', items: [{ content: '<img src=x onerror=p()>nested', items: [] }] },
      ] } },
    ] }
    const out = sanitizeDoc(doc)
    const items = out.blocks[0].data.items as { content: string; items: { content: string }[] }[]
    expect(items[0].content).toBe('a')
    expect(items[1].content).toBe('<b>b</b>')
    expect(items[1].items[0].content).toBe('nested')
  })
})
