/**
 * Section-aware Markdown chunker — the single shared chunking implementation.
 *
 * Replaces the old blind char-window splitters that lived in both seed-kb.ts and
 * ingest.processor.ts. Splits on Markdown heading / blank-line boundaries, keeps a
 * heading attached to the lines beneath it, packs small adjacent blocks up to a
 * token budget, and prefixes every emitted chunk with a context line so a chunk is
 * self-describing for retrieval (and carries ship/topic into kb_chunk.metadata,
 * which the keyword filter reads via metadata->>'ship').
 *
 * Token estimate: 1 token ≈ 4 chars. The budget is measured INCLUDING the context
 * prefix so an assembled chunk never exceeds the embedding window.
 */

export interface ChunkResult {
  content: string; // context-prefixed text — this is what gets embedded AND stored
  chunkIndex: number;
  heading: string | null;
  metadata: { ship?: string; topic?: string; heading?: string };
}

export interface ChunkOptions {
  title: string;
  ship?: string;
  topic?: string;
  maxTokens?: number; // default 400
  overlapTokens?: number; // default 50 — only used in the oversize char-window fallback
}

interface Block {
  heading: string | null;
  text: string;
}

const HEADING_RE = /^ {0,3}#{1,3}\s+\S/;

function isHeading(line: string): boolean {
  return HEADING_RE.test(line);
}

function stripHashes(line: string): string {
  return line.replace(/^ {0,3}#{1,3}\s+/, '').trim();
}

function buildPrefix(opts: ChunkOptions, heading: string | null): string {
  let p = `Title: ${opts.title}`;
  if (opts.ship) p += ` | Ship: ${opts.ship}`;
  if (opts.topic) p += ` | Topic: ${opts.topic}`;
  if (heading) p += ` | Section: ${heading}`;
  return p;
}

/**
 * Split an oversized section into char windows, snapping each cut to the nearest
 * newline (then space) so table rows / bullets aren't sliced mid-line. Overlap is
 * applied between windows; the caller repeats the heading prefix on every window.
 */
function charWindows(text: string, budget: number, overlapChars: number): string[] {
  const windows: string[] = [];
  // Cap overlap so a window always advances by at least half its budget.
  const overlap = Math.min(overlapChars, Math.floor(budget / 2));
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + budget, text.length);

    // Snap the cut back to a clean boundary (newline, then space) when not at EOF.
    if (end < text.length) {
      const lookback = Math.min(200, end - start);
      const slice = text.slice(end - lookback, end);
      const nl = slice.lastIndexOf('\n');
      const sp = slice.lastIndexOf(' ');
      if (nl > 0) end = end - lookback + nl;
      else if (sp > 0) end = end - lookback + sp;
    }

    const piece = text.slice(start, end).trim();
    if (piece.length > 0) windows.push(piece);

    if (end >= text.length) break;
    // Guarantee forward progress even if snapping pulled `end` close to `start`.
    const nextStart = end - overlap;
    start = nextStart > start ? nextStart : end;
  }

  return windows;
}

export function chunkDocument(content: string, opts: ChunkOptions): ChunkResult[] {
  const maxChars = (opts.maxTokens ?? 400) * 4;
  const overlapChars = (opts.overlapTokens ?? 50) * 4;
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  // ── Phase 1: parse into blocks, each tagged with its governing heading ──
  const lines = normalized.split('\n');
  const blocks: Block[] = [];
  let curHeading: string | null = null;
  let buf: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) blocks.push({ heading: curHeading, text });
    buf = [];
  };

  for (const line of lines) {
    const fence = line.trimStart().startsWith('```');
    if (fence) {
      inFence = !inFence;
      buf.push(line);
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }
    if (isHeading(line)) {
      flush(); // close the previous block before starting a new heading
      curHeading = stripHashes(line);
      buf.push(line); // heading stays attached to the lines that follow it
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();

  // Merge a heading-only block forward into the next block so a list title is
  // never orphaned from its items. (A heading directly followed by bullets is
  // already one block — there's no blank line to flush between them.)
  const merged: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // A "lone heading" block is one whose only content is the heading line itself.
    const bodyWithoutHeading = b.text
      .split('\n')
      .filter((l) => !isHeading(l))
      .join('\n')
      .trim();
    if (bodyWithoutHeading === '' && i + 1 < blocks.length) {
      const next = blocks[i + 1];
      merged.push({ heading: b.heading, text: `${b.text}\n${next.text}` });
      i++; // consume the next block into this heading
      continue;
    }
    merged.push(b);
  }

  // ── Phase 2: pack adjacent blocks under the same heading up to budget ──
  const packed: Block[] = [];
  let cur: Block | null = null;
  for (const b of merged) {
    if (cur && cur.heading === b.heading) {
      const candidate = `${cur.text}\n\n${b.text}`;
      const prefixLen = buildPrefix(opts, b.heading).length;
      if (prefixLen + 1 + candidate.length <= maxChars) {
        cur.text = candidate;
        continue;
      }
    }
    if (cur) packed.push(cur);
    cur = { heading: b.heading, text: b.text };
  }
  if (cur) packed.push(cur);

  // ── Phase 3: emit, char-window splitting any oversize section ──
  const out: ChunkResult[] = [];
  const push = (body: string, heading: string | null) => {
    const prefix = buildPrefix(opts, heading);
    const chunkContent = `${prefix}\n\n${body.trim()}`;
    const metadata: ChunkResult['metadata'] = {};
    if (opts.ship) metadata.ship = opts.ship;
    if (opts.topic) metadata.topic = opts.topic;
    if (heading) metadata.heading = heading;
    out.push({ content: chunkContent, chunkIndex: out.length, heading, metadata });
  };

  for (const p of packed) {
    const prefixLen = buildPrefix(opts, p.heading).length + 1;
    const budget = maxChars - prefixLen;
    if (p.text.length <= budget) {
      push(p.text, p.heading);
    } else {
      for (const window of charWindows(p.text, budget, overlapChars)) {
        push(window, p.heading); // heading repeated via prefix on every sub-chunk
      }
    }
  }

  return out;
}
