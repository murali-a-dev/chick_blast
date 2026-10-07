/**
 * Copies text to the clipboard with robust mobile and HTTP/HTTPS compatibility.
 * 
 * On mobile devices (iOS Safari, Android Chrome):
 * - navigator.clipboard is only available in Secure Contexts (HTTPS / localhost).
 *   When accessing over a local IP (e.g., http://192.168.x.x:5173), navigator.clipboard is undefined.
 * - This utility falls back to a temporary textarea with document.execCommand('copy'),
 *   which is 100% supported across all mobile browsers.
 */
export async function copyToClipboard(text) {
  if (!text) return false

  const stringText = String(text)

  // 1. Try modern Clipboard API if available in a secure context
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText &&
    (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    try {
      await navigator.clipboard.writeText(stringText)
      return true
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', err)
    }
  }

  // 2. Cross-browser mobile fallback (iOS Safari, Android Chrome, LAN over HTTP)
  let textArea = null
  try {
    textArea = document.createElement('textarea')
    textArea.value = stringText

    // Prevent scrolling or zooming on mobile
    textArea.style.fontSize = '16px'
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'
    textArea.style.opacity = '0'

    // Crucial for iOS WebKit:
    // Do NOT set readonly! readonly blocks document.execCommand('copy') on iOS Safari.
    textArea.setAttribute('contenteditable', 'true')
    textArea.readOnly = false

    document.body.appendChild(textArea)

    // iOS Safari compatible range selection
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

    if (isIOS) {
      const range = document.createRange()
      range.selectNodeContents(textArea)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      textArea.setSelectionRange(0, 999999)
    } else {
      textArea.focus()
      textArea.select()
      textArea.setSelectionRange(0, stringText.length)
    }

    const successful = document.execCommand('copy')

    if (window.getSelection) {
      window.getSelection().removeAllRanges()
    }

    return Boolean(successful)
  } catch (fallbackErr) {
    console.error('Fallback copy to clipboard failed:', fallbackErr)
    return false
  } finally {
    if (textArea && textArea.parentNode) {
      textArea.parentNode.removeChild(textArea)
    }
  }
}
