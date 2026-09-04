export interface HoveredWordInfo {
  word: string
  rect: DOMRect
  containerOffset?: { x: number, y: number }
}

export function extractWordFromPoint(doc: Document, x: number, y: number): { word: string, rect: DOMRect } | null {
  try {
    let range: Range | null = null;
    
    // WebKit (Chrome, Safari, newer Edge)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((doc as any).caretRangeFromPoint) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      range = (doc as any).caretRangeFromPoint(x, y);
    } 
    // Firefox fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else if ((doc as any).caretPositionFromPoint) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pos = (doc as any).caretPositionFromPoint(x, y);
      if (pos) {
        range = doc.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    if (!range) return null;
    
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    
    const text = node.textContent || '';
    if (!text.trim()) return null;
    
    const offset = range.startOffset;
    
    // Find boundaries using non-whitespace characters to encircle the entire visual word
    const isWordChar = (char: string) => /\S/.test(char);
    
    let start = offset;
    let end = offset;
    
    if (start >= text.length || !isWordChar(text[start])) {
      if (start > 0 && isWordChar(text[start - 1])) {
        start--;
        end--;
      } else {
        return null;
      }
    }
    
    while (start > 0 && isWordChar(text[start - 1])) start--;
    while (end < text.length && isWordChar(text[end])) end++;
    
    const word = text.slice(start, end).trim();
    if (!word || word.length < 2) return null;
    
    const wordRange = doc.createRange();
    wordRange.setStart(node, start);
    wordRange.setEnd(node, end);
    
    const rects = wordRange.getClientRects();
    if (rects.length === 0) return null;
    
    return {
      word,
      rect: rects[0]
    };
  } catch {
    return null;
  }
}
