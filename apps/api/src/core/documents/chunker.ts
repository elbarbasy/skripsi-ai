/** Split long text into overlapping chunks suitable for embedding. */
export function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];

  // Split on paragraph boundaries first, then pack into chunks.
  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > chunkSize && current) {
      chunks.push(current.trim());
      // start new chunk with overlap tail of previous
      current = current.slice(Math.max(0, current.length - overlap)) + '\n\n' + para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Hard-split any oversized chunk.
  const result: string[] = [];
  for (const c of chunks) {
    if (c.length <= chunkSize * 1.5) {
      result.push(c);
    } else {
      for (let i = 0; i < c.length; i += chunkSize - overlap) {
        result.push(c.slice(i, i + chunkSize));
      }
    }
  }
  return result;
}
