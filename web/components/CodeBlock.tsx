import { codeToHtml } from 'shiki'

interface Props {
  code: string
  lang: 'typescript' | 'bash' | 'json' | 'text'
}

export async function CodeBlock({ code, lang }: Props) {
  const html = await codeToHtml(code, { lang, theme: 'github-dark' })
  return (
    <div
      className="overflow-x-auto rounded-md border border-border text-sm [&>pre]:p-4 [&>pre]:!bg-surface [&>pre]:font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
