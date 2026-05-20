from pyeditorjs import EditorJsParser


def validate_editorjs_blocks(blocks: list) -> list:
    editor_data = {"time": 0, "blocks": blocks, "version": "2.28.0"}
    parser = EditorJsParser(editor_data)
    html = parser.html(sanitize=True)
    if not html and blocks:
        raise ValueError("Invalid EditorJS blocks")
    return blocks
