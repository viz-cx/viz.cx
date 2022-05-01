export function markdown_clear_code(text: string) {
    let bold_pattern = /\*\*(.*?)\*\*/gm
    text = text.replace(bold_pattern, '$1')
    let italic_pattern = /\_\_(.*?)\_\_/gm
    text = text.replace(italic_pattern, '$1')
    let strikethrough_pattern = /\~\~(.*?)\~\~/gm
    text = text.replace(strikethrough_pattern, '$1')
    let inline_code_pattern = /\`(.*?)\`/gm
    text = text.replace(inline_code_pattern, '$1')

    let images_pattern = /\!\[(.*?)\]\((.*?)\)/gm
    text = text.replace(images_pattern, '$2 $1')

    let links_pattern = /\[(.*?)\]\((.*?)\)/gm
    text = text.replace(links_pattern, '$2 $1')

    text = text.trim()
    return text
}

export function markdown_decode_text(text: string) {
    //Using HTML Entity (hex)
    text = fast_str_replace('&#x23;', '#', text)//second
    text = fast_str_replace('&#x26;', '&', text)//first

    text = fast_str_replace('&#x7e;', '~', text)
    text = fast_str_replace('&#x60;', '`', text)
    text = fast_str_replace('&#x5b;', '[', text)
    text = fast_str_replace('&#x5d;', ']', text)
    text = fast_str_replace('&#x28;', '(', text)
    text = fast_str_replace('&#x29;', ')', text)
    text = fast_str_replace('&#x5f;', '_', text)
    //text=fast_str_replace('&#x3e;','>',text)
    //text=fast_str_replace('&#x3c;','<',text)
    //text=fast_str_replace('&#x22;','"',text)
    text = fast_str_replace('&#x2a;', '*', text)
    return text
}

function fast_str_replace(search: string, replace: string, str: string) {
    return str.split(search).join(replace)
}