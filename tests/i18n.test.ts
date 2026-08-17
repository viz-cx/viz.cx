import { describe, it, expect } from 'vitest'
import { dict, t, langHref, isLang } from '../lib/i18n'
describe('i18n', () => {
  it('en and ru have identical key sets', () =>
    expect(Object.keys(dict.en).sort()).toEqual(Object.keys(dict.ru).sort()))
  it('langHref prefixes ru only', () => {
    expect(langHref('en', '/feed')).toBe('/feed')
    expect(langHref('ru', '/feed')).toBe('/ru/feed')
    expect(langHref('ru', '/')).toBe('/ru')
  })
  it('isLang', () => { expect(isLang('ru')).toBe(true); expect(isLang('de')).toBe(false) })
  it('t falls back to key', () => expect(t('en', 'nav.latest')).not.toBe(''))
})
