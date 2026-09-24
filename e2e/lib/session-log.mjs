// Session-log reader for the e2e checks.
//
// DSH stores a session as an APPEND-ONLY sequence of zstd frames, one JSONL
// record batch per frame (`session.v4.jsonl.zstd`). Two traps live here:
//
//   1. zlib's zstdDecompressSync / createZstdDecompress stop after the FIRST
//      frame, so a naive read returns the header and nothing else (a 12 MB
//      session decodes to ~230 bytes). The frames must be walked explicitly.
//   2. Frames are concatenated with no index, so the only way to find a
//      boundary is to parse each frame header and walk its block chain.
//
// The frame walk below is authoritative: it parses the frame header descriptor
// (single-segment flag, dictionary id, frame content size) and then walks the
// 3-byte block headers until the last-block bit, honouring the RLE payload
// rule. It stops at the first unparseable offset, which is what a torn tail
// looks like — that is reported, never silently ignored.
import { readFileSync } from "node:fs";
import { zstdDecompressSync } from "node:zlib";

const ZSTD_MAGIC = 0xfd2fb528;
const SKIPPABLE_MASK = 0xfffffff0;
const SKIPPABLE_BASE = 0x184d2a50;

/** Byte offset just past the frame that starts at `off`. */
function frameEnd(buf, off) {
  if (buf.readUInt32LE(off) !== ZSTD_MAGIC >>> 0) throw new Error(`bad zstd magic at ${off}`);
  let p = off + 4;
  const descriptor = buf[p];
  p += 1;
  const contentSizeFlag = descriptor >> 6;
  const singleSegment = (descriptor >> 5) & 1;
  const checksumFlag = (descriptor >> 2) & 1;
  const dictionaryIdFlag = descriptor & 3;
  if (!singleSegment) p += 1; // window descriptor
  p += [0, 1, 2, 4][dictionaryIdFlag];
  p += contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : [0, 2, 4, 8][contentSizeFlag];
  for (;;) {
    if (p + 3 > buf.length) throw new Error("truncated block header");
    const header = buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16);
    p += 3;
    const lastBlock = header & 1;
    const blockType = (header >> 1) & 3;
    const blockSize = header >> 3;
    p += blockType === 1 ? 1 : blockSize; // RLE carries one byte, raw/compressed carry blockSize
    if (lastBlock) break;
  }
  if (checksumFlag) p += 4;
  return p;
}

/** Decode every frame in the file into its JSONL records. */
export function readSessionLog(file) {
  const buf = readFileSync(file);
  const chunks = [];
  let offset = 0;
  let frames = 0;
  let torn = 0;
  while (offset < buf.length) {
    if (buf.length - offset >= 8 && (buf.readUInt32LE(offset) & SKIPPABLE_MASK) === SKIPPABLE_BASE) {
      offset += 8 + buf.readUInt32LE(offset + 4); // skippable frame: skip wholesale
      continue;
    }
    let end;
    try {
      end = frameEnd(buf, offset);
    } catch {
      torn = 1;
      break;
    }
    try {
      chunks.push(zstdDecompressSync(buf.subarray(offset, end)));
      frames += 1;
    } catch {
      torn = 1;
      break;
    }
    offset = end;
  }
  const text = Buffer.concat(chunks).toString("utf8");
  const records = text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
  const header = records[0]?.type === "session" ? records[0] : undefined;
  return { header, events: header === undefined ? records : records.slice(1), frames, torn, bytes: buf.length };
}

/** A surface node's origin: `"append"` for a fresh node, otherwise a replacement object. */
export function surfaceOpOf(event) {
  return event.surfaceOp;
}

export function isAppend(event) {
  return event.surfaceOp === "append";
}

/**
 * Fold the surface: appends add a node, a replacement swaps the covered span for
 * itself. Mirrors the host surface fold (dsh-session/lib, foldSurface).
 */
export function foldSurface(events) {
  const nodes = [];
  for (const event of events) {
    const op = event.surfaceOp;
    if (op === undefined) continue;
    if (op === "append") {
      nodes.push(event.seq);
      continue;
    }
    const start = nodes.indexOf(op.startSeq);
    const end = nodes.indexOf(op.endSeq);
    if (start < 0 || end < 0) continue; // cover already gone: nothing to fold
    nodes.splice(start, end - start + 1, event.seq);
  }
  return nodes;
}

/** `§N§ ` prefix carried by a persisted message, or null. */
export function prefixOf(event) {
  const text = (event.data?.content ?? []).map((part) => part.text ?? "").join("");
  const match = /^§(\d+)§/.exec(text);
  return match === null ? null : Number(match[1]);
}
