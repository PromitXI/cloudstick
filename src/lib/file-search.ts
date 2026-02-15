/**
 * File metadata search engine.
 * Fetches all blobs for a user from Azure, builds an in-memory metadata index,
 * then matches against structured filters (keywords, date ranges, types, sizes).
 */

import { getContainerClient, getUserPrefix, type FileItem } from "./azure-storage";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FileMetadata {
  name: string;
  path: string;
  folder: string;
  extension: string;
  size: number;
  contentType: string;
  lastModified: string;
  /** similarity / relevance score 0-1 */
  score: number;
  /** why this file matched */
  reason: string;
}

export interface SearchFilters {
  keywords?: string[];
  extensions?: string[];
  contentTypes?: string[];
  folders?: string[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: string;
  modifiedBefore?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const EXTENSION_TO_CATEGORY: Record<string, string> = {
  // Documents
  pdf: "document", doc: "document", docx: "document", txt: "document",
  rtf: "document", odt: "document", md: "document",
  // Spreadsheets
  xls: "spreadsheet", xlsx: "spreadsheet", csv: "spreadsheet", ods: "spreadsheet",
  // Presentations
  ppt: "presentation", pptx: "presentation", odp: "presentation",
  // Images
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
  svg: "image", bmp: "image", ico: "image", tiff: "image",
  // Videos
  mp4: "video", avi: "video", mov: "video", mkv: "video", webm: "video",
  // Audio
  mp3: "audio", wav: "audio", ogg: "audio", flac: "audio", aac: "audio",
  // Archives
  zip: "archive", tar: "archive", gz: "archive", rar: "archive", "7z": "archive",
  // Code
  js: "code", ts: "code", py: "code", java: "code", html: "code",
  css: "code", json: "code", xml: "code", yaml: "code", yml: "code",
};

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getFolder(path: string): string {
  const parts = path.split("/");
  parts.pop(); // remove filename
  return parts.join("/") || "/";
}

/**
 * Levenshtein-based fuzzy match. Returns 0-1 similarity.
 */
function fuzzyScore(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  // Simple bigram similarity (faster than full Levenshtein for search)
  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));
  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) if (bigramsB.has(bg)) intersection++;
  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Core search ──────────────────────────────────────────────────────────────

/**
 * Fetch ALL file metadata for a user (flat listing).
 */
export async function getAllUserFiles(userId: string): Promise<FileItem[]> {
  const container = await getContainerClient();
  const prefix = getUserPrefix(userId);
  const files: FileItem[] = [];

  for await (const blob of container.listBlobsFlat({ prefix })) {
    const fileName = blob.name.slice(prefix.length);
    // Skip folder markers
    if (fileName.endsWith(".folder") || !fileName) continue;

    files.push({
      name: fileName.split("/").pop() || fileName,
      path: fileName,
      size: blob.properties.contentLength || 0,
      contentType: blob.properties.contentType || "application/octet-stream",
      lastModified: blob.properties.lastModified?.toISOString() || new Date().toISOString(),
      url: "", // not needed for search
    });
  }

  return files;
}

/**
 * Search user files using structured filters.
 * Returns ranked results with scores and reasons.
 */
export async function searchFiles(
  userId: string,
  filters: SearchFilters,
  limit: number = 10
): Promise<FileMetadata[]> {
  const allFiles = await getAllUserFiles(userId);
  const results: FileMetadata[] = [];

  for (const file of allFiles) {
    const ext = getExtension(file.name);
    const folder = getFolder(file.path);
    const category = EXTENSION_TO_CATEGORY[ext] || "other";
    let score = 0;
    const reasons: string[] = [];

    // ── Keyword matching ─────────────────────────────────────────────────
    if (filters.keywords && filters.keywords.length > 0) {
      const nameLower = file.name.toLowerCase();
      const pathLower = file.path.toLowerCase();

      for (const kw of filters.keywords) {
        const kwLower = kw.toLowerCase();

        // Exact substring match in name
        if (nameLower.includes(kwLower)) {
          score += 0.4;
          reasons.push(`Name contains "${kw}"`);
        }
        // Path match
        else if (pathLower.includes(kwLower)) {
          score += 0.25;
          reasons.push(`Path contains "${kw}"`);
        }
        // Category match (e.g. "document", "image", "video")
        else if (category === kwLower || category.includes(kwLower)) {
          score += 0.3;
          reasons.push(`File type is ${category}`);
        }
        // Extension match
        else if (ext === kwLower) {
          score += 0.35;
          reasons.push(`Extension is .${ext}`);
        }
        // Fuzzy match
        else {
          const fs = fuzzyScore(nameLower, kwLower);
          if (fs > 0.3) {
            score += fs * 0.3;
            reasons.push(`Similar to "${kw}" (${Math.round(fs * 100)}%)`);
          }
        }
      }
    }

    // ── Extension filter ─────────────────────────────────────────────────
    if (filters.extensions && filters.extensions.length > 0) {
      if (filters.extensions.includes(ext)) {
        score += 0.3;
        reasons.push(`Extension .${ext} matches`);
      } else {
        continue; // hard filter
      }
    }

    // ── Content type filter ──────────────────────────────────────────────
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      const matches = filters.contentTypes.some(
        (ct) => file.contentType.includes(ct) || category === ct
      );
      if (matches) {
        score += 0.2;
        reasons.push(`Content type matches`);
      } else {
        continue; // hard filter
      }
    }

    // ── Folder filter ────────────────────────────────────────────────────
    if (filters.folders && filters.folders.length > 0) {
      const folderMatch = filters.folders.some((f) =>
        folder.toLowerCase().includes(f.toLowerCase())
      );
      if (folderMatch) {
        score += 0.15;
        reasons.push(`In matching folder`);
      }
    }

    // ── Size filters ─────────────────────────────────────────────────────
    if (filters.minSize !== undefined && file.size < filters.minSize) continue;
    if (filters.maxSize !== undefined && file.size > filters.maxSize) continue;

    // ── Date filters ─────────────────────────────────────────────────────
    if (filters.modifiedAfter) {
      const after = new Date(filters.modifiedAfter);
      if (new Date(file.lastModified) < after) continue;
    }
    if (filters.modifiedBefore) {
      const before = new Date(filters.modifiedBefore);
      if (new Date(file.lastModified) > before) continue;
    }

    // Only include if there's some relevance
    if (score > 0 || Object.keys(filters).length === 0) {
      results.push({
        name: file.name,
        path: file.path,
        folder,
        extension: ext,
        size: file.size,
        contentType: file.contentType,
        lastModified: file.lastModified,
        score: Math.min(score, 1),
        reason: reasons.length > 0 ? reasons.join("; ") : "Listed all files",
      });
    }
  }

  // Sort by score descending, then by lastModified descending
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
  });

  return results.slice(0, limit);
}
