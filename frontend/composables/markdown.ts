export function markdown(str: string): string {
  str = html_safe_images(markdown_decode(str))
  str = highlight_links(str, true) //ignore html tags (images and links)
  return str
}

export function markdownTitle(str: string): string {
  let strikethrough_pattern = /\~\~(.*?)\~\~/gm
  return markdown_decode_text(
    str.replace(strikethrough_pattern, "<strike>$1</strike>")
  )
}

function markdown_decode_text(text: string) {
  text = fast_str_replace("&#x23", "#", text)
  text = fast_str_replace("&#x26", "&", text)
  text = fast_str_replace("&#x7e", "~", text)
  text = fast_str_replace("&#x60", "`", text)
  text = fast_str_replace("&#x5b", "[", text)
  text = fast_str_replace("&#x5d", "]", text)
  text = fast_str_replace("&#x28", "(", text)
  text = fast_str_replace("&#x29", ")", text)
  text = fast_str_replace("&#x5f", "_", text)
  text = fast_str_replace("&#x2a", "*", text)
  return text
}

function fast_str_replace(
  search: string,
  replace: string,
  str: string
): string {
  return str.split(search).join(replace)
}

function markdown_decode(text: string, rewrite_block: any = undefined) {
  let set_id = false
  let section = false
  let subsection = false
  let list: boolean | string = false
  let section_num = 1
  let subsection_num = 1
  rewrite_block = typeof rewrite_block === "undefined" ? false : rewrite_block
  text = text.trim()
  while (-1 != text.indexOf("\n\n\n")) {
    text = fast_str_replace("\n\n\n", "\n\n", text)
  }
  text = fast_str_replace("\r", "", text)
  //let images_pattern=/\!\[(.*?)\]\((.*?)\)/gm
  let text_arr = text.split("\n\n")
  let html = ""
  for (let i in text_arr) {
    set_id = false
    section = false
    subsection = false
    list = false
    let el = text_arr[i]
    let first: string | boolean = false
    let context: string | boolean = false
    if (-1 != el.indexOf(" ")) {
      first = el.substring(0, el.indexOf(" "))
    }
    let block = "p"
    if (false !== first) {
      if (">>" == first) {
        block = "blockquote"
      } else if (">" == first) {
        block = "cite"
      } else if ("*" == first) {
        block = "ul"
        list = "ul"
      } else if ("*n" == first) {
        block = "ol"
        list = "ol"
      } else if ("##" == first) {
        block = "h2"
        set_id = true
        section = true
      } else if ("###" == first) {
        block = "h3"
        set_id = true
        subsection = true
      } else {
        first = false
      }
    }
    if (false !== rewrite_block) {
      block = rewrite_block
    }
    if (false !== list) {
      context = markdown_decode_list(el, list)
    } else if (false !== first) {
      context = el.substring(el.indexOf(" ") + 1)
    } else {
      context = el
    }
    let result = ""
    if ("***" == el) {
      result = "<hr />"
    } else {
      let id_addon = ""
      if (set_id) {
        id_addon += ' id="'
        if (section) {
          id_addon += "section-" + section_num
          section_num++
          subsection_num = 1
        }
        if (subsection) {
          id_addon +=
            "section-" + Math.max(section_num - 1, 1) + "-" + subsection_num
          subsection_num++
        }
        id_addon += '"'
        set_id = false
        section = false
        subsection = false
      }
      result += "<" + block + id_addon + ">"
      result += markdown_code(context)
      result += "</" + block + ">"
    }
    html += result + "\n"
  }
  return html.trim()
}

function html_safe_images(html: string) {
  let arr = html.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
  for (let i in arr) {
    let img = arr[i as any]
    let img_src_pattern = /(.*)src=\"(.*?)\"(.*)/gm
    let src = img.replace(img_src_pattern, "$2")
    let safe_src = safe_image(src)
    let new_img = ""
    if (false === safe_src) {
      new_img = ""
    } else {
      new_img = fast_str_replace(src, safe_src, img)
    }
    html = fast_str_replace(img, new_img, html)
  }
  return html
}

function highlight_links(text: string, is_html: boolean) {
  let summary_html: string[] = []
  let html_num = 0

  if (is_html) {
    let html_img_pattern = /<img(.[^>]*)>/gim
    let html_href_pattern = /<a (.[^>]*)>(.*)<\/a>/gim
    let html_arr = text.match(html_img_pattern)
    if (null != html_arr) {
      for (let i in html_arr) {
        if (1 < html_arr[i].length) {
          summary_html[html_num] = html_arr[i]
          html_num++
        }
      }
    }
    html_arr = text.match(html_href_pattern)
    if (null != html_arr) {
      for (let i in html_arr) {
        if (1 < html_arr[i].length) {
          summary_html[html_num] = html_arr[i]
          html_num++
        }
      }
    }

    summary_html = array_unique(summary_html)
    summary_html.sort(sort_by_length_asc)

    for (let i in summary_html) {
      text = fast_str_replace(summary_html[i], "<REPLACE_HTML_" + i + ">", text)
    }
  }

  let summary_links = []
  let num = 0

  let summary_mnemonics = []
  let mnemonics_num = 0

  let mnemonics_pattern = /&#[a-z0-9\-\.]+/g
  let mnemonics_arr = text.match(mnemonics_pattern)
  if (null != mnemonics_arr) {
    for (let i in mnemonics_arr) {
      if (1 < mnemonics_arr[i].length) {
        summary_mnemonics[mnemonics_num] = mnemonics_arr[i]
        mnemonics_num++
      }
    }
  }

  summary_mnemonics = array_unique(summary_mnemonics)
  summary_mnemonics.sort(sort_by_length_desc)

  for (let i in summary_mnemonics) {
    text = fast_str_replace(
      summary_mnemonics[i],
      "<REPLACE_MNEMONIC_" + i + ">",
      text
    )
  }

  let account_pattern = /@[a-z0-9\-\.]+/g
  let account_links = text.match(account_pattern)
  if (null != account_links) {
    for (let i in account_links) {
      if (1 < account_links[i].length) {
        summary_links[num] = account_links[i]
        num++
      }
    }
  }

  let viz_protocol_pattern = /viz\:\/\/[@a-z0-9\-\.\/]+/g
  let viz_protocol_links = text.match(viz_protocol_pattern)
  if (null != viz_protocol_links) {
    for (let i in viz_protocol_links) {
      if (6 < viz_protocol_links[i].length) {
        summary_links[num] = viz_protocol_links[i]
        num++
      }
    }
  }

  let sia_protocol_pattern = /sia\:\/\/[A-Za-z0-9_\-\.\/]+/g
  let sia_protocol_links = text.match(sia_protocol_pattern)
  if (null != sia_protocol_links) {
    for (let i in sia_protocol_links) {
      if (6 < sia_protocol_links[i].length) {
        summary_links[num] = sia_protocol_links[i]
        num++
      }
    }
  }

  let ipfs_protocol_pattern = /ipfs\:\/\/[A-Za-z0-9_\-\.\/]+/g
  let ipfs_protocol_links = text.match(ipfs_protocol_pattern)
  if (null != ipfs_protocol_links) {
    for (let i in ipfs_protocol_links) {
      if (7 < ipfs_protocol_links[i].length) {
        summary_links[num] = ipfs_protocol_links[i]
        num++
      }
    }
  }

  //let http_protocol_pattern = /(http|https)\:\/\/[@A-Za-z0-9\-_\.\/#]*/g//first version
  //add \u0400-\u04FF for cyrillic https://jrgraphix.net/r/Unicode/0400-04FF
  let http_protocol_pattern =
    /((?:https?|ftp):\/\/[\u0400-\u04FF\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.]*[\u0400-\u04FF\-A-Z0-9+\u0026@#\/%=~()_|])/gi
  let http_protocol_links = text.match(http_protocol_pattern)
  if (null != http_protocol_links) {
    for (let i in http_protocol_links) {
      summary_links[num] = http_protocol_links[i]
      num++
    }
  }

  //let http_protocol_pattern = /(http|https)\:\/\/[@A-Za-z0-9\-_\.\/#]*/g//first version
  //add \u0400-\u04FF for cyrillic https://jrgraphix.net/r/Unicode/0400-04FF
  let magnet_protocol_pattern =
    /((magnet):[\u0400-\u04FF\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.&]*[\u0400-\u04FF\-A-Z0-9+\u0026@#\/%=~()_|])/gi
  let magnet_protocol_links = text.match(magnet_protocol_pattern)
  if (null != magnet_protocol_links) {
    for (let i in magnet_protocol_links) {
      summary_links[num] = magnet_protocol_links[i]
      num++
    }
  }

  //hashtags highlights after links for avoid conflicts with url with hashes (not necessary, because array sorted by length)
  let hashtags_pattern = /(|\b)#([^:@#!.,?\r\n\t <>()\[\]]+)(|\b)/g
  let hashtags_links = text.match(hashtags_pattern)
  if (null != hashtags_links) {
    for (let i in hashtags_links) {
      if (1 < hashtags_links[i].length) {
        summary_links[num] = hashtags_links[i]
        num++
      }
    }
  }

  for (let i in summary_links) {
    if (-1 != summary_links[i].indexOf(")")) {
      if (-1 == summary_links[i].indexOf("(")) {
        summary_links[i] = summary_links[i].substring(
          0,
          summary_links[i].indexOf(")")
        )
      }
    }
  }
  summary_links = array_unique(summary_links)
  summary_links.sort(sort_by_length_desc)

  for (let i in summary_links) {
    text = fast_str_replace(summary_links[i], "<REPLACE_LINK_" + i + ">", text)
  }

  for (let i in summary_links) {
    let change_text = summary_links[i]
    let new_text = change_text
    if ("#" == change_text.substring(0, 1)) {
      new_text =
        '<a tabindex="0" data-href="dapp:hashtags/' +
        change_text.substring(1).toLowerCase() +
        '/">' +
        change_text +
        "</a>"
    } else if ("@" == change_text.substring(0, 1)) {
      new_text =
        '<a tabindex="0" data-href="viz://' +
        change_text +
        '/">' +
        change_text +
        "</a>"
    } else if ("viz://" == change_text.substring(0, 6)) {
      new_text =
        '<a tabindex="0" data-href="' +
        change_text +
        '">' +
        change_text +
        "</a>"
    } else if ("sia://" == change_text.substring(0, 6)) {
      new_text =
        '<a tabindex="0" href="' +
        sia_link(change_text.substring(6)) +
        '" target="_blank">' +
        change_text +
        "</a>"
    } else if ("ipfs://" == change_text.substring(0, 7)) {
      new_text =
        '<a tabindex="0" href="' +
        ipfs_link(change_text.substring(7)) +
        '" target="_blank">' +
        change_text +
        "</a>"
    } else {
      new_text =
        '<a href="' + change_text + '" target="_blank">' + change_text + "</a>"
    }
    text = fast_str_replace("<REPLACE_LINK_" + i + ">", new_text, text)
  }

  for (let i in summary_mnemonics) {
    text = fast_str_replace(
      "<REPLACE_MNEMONIC_" + i + ">",
      summary_mnemonics[i],
      text
    )
  }

  if (is_html) {
    for (let i in summary_html) {
      text = fast_str_replace("<REPLACE_HTML_" + i + ">", summary_html[i], text)
    }
  }

  return text
}

function markdown_code(text: string | boolean) {
  if (typeof text === "boolean") {
    return
  }
  let bold_pattern = /\*\*(.[\s\S]*?)\*\*/gm
  text = text.replace(bold_pattern, "<b>$1</b>")
  let italic_pattern = /\_\_(.[\s\S]*?)\_\_/gm
  text = text.replace(italic_pattern, "<i>$1</i>")
  let strikethrough_pattern = /\~\~(.[\s\S]*?)\~\~/gm
  text = text.replace(strikethrough_pattern, "<strike>$1</strike>")
  let inline_code_pattern = /\`(.*?)\`/gm
  text = text.replace(inline_code_pattern, "<code>$1</code>")

  let images_pattern = /\!\[(.*?)\]\((.*?)\)/gm
  text = text.replace(images_pattern, '<img src="$2" alt="$1"/>')

  let links_pattern = /\[(.*?)\]\((.*?)\)/gm
  let link_pattern = /\[(.*?)\]\((.*?)\)/m
  let links_arr = text.match(links_pattern)
  if (null !== links_arr) {
    if (typeof links_arr[0] != "undefined") {
      for (let i in links_arr) {
        let link = links_arr[i]
        let link_arr = link.match(link_pattern)
        if (null !== link_arr) {
          if ("#" == link_arr[2].substr(0, 1)) {
            //link to section
            text = text.replaceAll(
              link,
              '<a data-section="' +
                link_arr[2].substr(1) +
                '">' +
                link_arr[1] +
                "</a>"
            )
          } else {
            text = text.replaceAll(
              link,
              '<a href="' +
                link_arr[2] +
                '" target="_blank">' +
                link_arr[1] +
                "</a>"
            )
          }
        }
      }
    }
  }
  //text=text.replace(links_pattern,'<a href="$2">$1</a>')

  text = markdown_decode_text(text)
  text = text.trim()
  text = text.replaceAll("\n", "\n<br />\n")
  return text
}

function array_unique(arr: Array<string>) {
  return arr.filter(function (item, pos) {
    return arr.indexOf(item) == pos
  })
}

function sort_by_length_asc(a: string, b: string) {
  return a.length - b.length
}

function sort_by_length_desc(a: string, b: string) {
  return b.length - a.length
}

function markdown_decode_list(text: string, type: string) {
  let result = ""
  result += "<li>"
  let text_arr = text.split("\n")
  console.log("markdown_decode_list", text, text_arr)
  for (let i in text_arr) {
    let context = text_arr[i]
    let first: boolean | string = false
    if (-1 != context.indexOf(" ")) {
      first = context.substring(0, context.indexOf(" "))
      if ("ul" == type) {
        if ("*" == first) {
          context = context.substring(context.indexOf(" ") + 1)
          context = "</li><li>" + context
        } else {
          context = "<br>" + context
        }
      } else if ("ol" == type) {
        if ("*n" == first) {
          context = context.substring(context.indexOf(" ") + 1)
          context = "</li><li>" + context
        } else {
          context = "<br>" + context
        }
      }
    } else {
      context = "<br>" + context
    }
    result += context
  }
  result += "</li>"
  result = fast_str_replace("<li></li>", "", result)
  return result
}

function safe_image(link: string) {
  let result = ""
  let error = false
  //console.log(typeof avatar,avatar)
  if (0 == link.indexOf("https://")) {
    result = link
  } else if (0 == link.indexOf("ipfs://")) {
    result = ipfs_link(link.substring(7))
  } else if (0 == link.indexOf("sia://")) {
    result = sia_link(link.substring(6))
  } else if (0 == link.indexOf("http://")) {
    error = true //no http
  } else if (0 == link.indexOf("data:")) {
    error = true //no encoded
  } else {
    error = true //unknown
  }
  if (error) {
    return false
  }
  return result
}

function ipfs_link(cid: string) {
  return "https://cloudflare-ipfs.com/ipfs/" + cid
}
function sia_link(skylink: string) {
  return "https://siasky.net/" + skylink
}
