import { posts } from './db'
const RU: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
export function slugify(title: string): string {
  const base = [...title.toLowerCase()].map(c => RU[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '')
  return base || 'post'
}
export async function uniqueSlug(author: string, title: string): Promise<string> {
  const base = slugify(title)
  const taken = new Set((await posts().find({ author, slug: { $regex: `^${base}(-\\d+)?$` } }, { projection: { slug: 1 } }).toArray()).map(p => p.slug))
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}
