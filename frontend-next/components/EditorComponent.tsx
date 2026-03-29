"use client"

import { useRef, useCallback } from "react"

interface EditorComponentProps {
  onChange: (blocks: any[]) => void
  initialBlocks?: any[]
}

export default function EditorComponent({ onChange, initialBlocks }: EditorComponentProps) {
  const editorRef = useRef<any>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  const initEditor = useCallback(async () => {
    if (initialized.current || !holderRef.current) return
    initialized.current = true

    const EditorJS = (await import("@editorjs/editorjs")).default
    const Header = (await import("@editorjs/header")).default
    const List = (await import("@editorjs/list")).default
    const Quote = (await import("@editorjs/quote")).default
    const Delimiter = (await import("@editorjs/delimiter")).default
    const CodeTool = (await import("@editorjs/code")).default

    editorRef.current = new EditorJS({
      holder: holderRef.current,
      placeholder: "Write something...",
      data: initialBlocks ? { blocks: initialBlocks } : undefined,
      tools: {
        header: { class: Header as any, config: { levels: [2, 3], defaultLevel: 2 } },
        list: List as any,
        quote: Quote as any,
        delimiter: Delimiter as any,
        code: CodeTool as any,
      },
      onChange: async () => {
        if (editorRef.current) {
          const data = await editorRef.current.save()
          onChange(data.blocks)
        }
      },
    })
  }, [onChange, initialBlocks])

  return (
    <div
      ref={(el) => {
        (holderRef as any).current = el
        if (el) initEditor()
      }}
      className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[200px] bg-white dark:bg-gray-800 prose dark:prose-invert max-w-none"
    />
  )
}
