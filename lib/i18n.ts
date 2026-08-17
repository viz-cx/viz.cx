import type { Lang } from './types'
export const LANGS: Lang[] = ['en', 'ru']
export const isLang = (x: string): x is Lang => (LANGS as string[]).includes(x)
export const dict = {
  en: { 'nav.latest': 'Latest', 'nav.feed': 'Feed', 'nav.write': 'Write', 'nav.login': 'Log in',
        'post.award': 'Award VIZ', 'post.comments': 'Comments', 'post.follow': 'Follow', 'post.unfollow': 'Unfollow',
        'write.title': 'Title', 'write.publish': 'Publish', 'write.draft': 'Save draft', 'write.tags': 'Tags (comma-separated)' },
  ru: { 'nav.latest': 'Свежее', 'nav.feed': 'Лента', 'nav.write': 'Написать', 'nav.login': 'Войти',
        'post.award': 'Наградить VIZ', 'post.comments': 'Комментарии', 'post.follow': 'Подписаться', 'post.unfollow': 'Отписаться',
        'write.title': 'Заголовок', 'write.publish': 'Опубликовать', 'write.draft': 'Сохранить черновик', 'write.tags': 'Теги (через запятую)' },
} as const satisfies Record<Lang, Record<string, string>>
export type DictKey = keyof typeof dict.en
export const t = (lang: Lang, key: DictKey): string => dict[lang][key] ?? key
export const langHref = (lang: Lang, path: string): string =>
  lang === 'en' ? path : path === '/' ? '/ru' : `/ru${path}`
