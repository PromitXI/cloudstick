/**
 * Document content extraction utility.
 * Reads text from PDFs, DOCX, and plain-text blobs stored in Azure.
 */

import { readBlobContent } from "./azure-storage";

// Supported text extensions (read raw)
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "csv", "json", "xml", "yaml", "yml",
  "js", "ts", "py", "java", "html", "css", "log",
  "ini", "cfg", "env", "sh", "bat", "sql", "r",
]);

/**
 * Extract readable text content from a file stored in Azure Blob Storage.
 * Supports: plain text, PDF, DOCX. Returns empty string for unsupported types.
 * Content is truncated to maxChars to avoid blowing up context windows.
 */
export async function extractFileContent(
  userId: string,
  filePath: string,
  maxChars: number = 30000
): Promise<string> {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";

  try {
    const { buffer, contentType } = await readBlobContent(userId, filePath);

    // ── Plain text ─────────────────────────────────────────────────────
    if (
      TEXT_EXTENSIONS.has(ext) ||
      contentType.startsWith("text/") ||
      contentType.includes("json") ||
      contentType.includes("xml")
    ) {
      const text = buffer.toString("utf-8");
      return text.slice(0, maxChars);
    }

    // ── PDF ────────────────────────────────────────────────────────────
    if (ext === "pdf" || contentType.includes("pdf")) {
      try {
        const { PDFParse } = await import("pdf-parse");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser: any = new PDFParse(buffer);
        await parser.load();
        const text: string = await parser.getText();
        return (text || "").slice(0, maxChars);
      } catch (e) {
        console.error("PDF parsing failed:", e);
        return "";
      }
    }

    // ── DOCX ───────────────────────────────────────────────────────────
    if (
      ext === "docx" ||
      contentType.includes("wordprocessingml") ||
      contentType.includes("msword")
    ) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return (result.value || "").slice(0, maxChars);
      } catch (e) {
        console.error("DOCX parsing failed:", e);
        return "";
      }
    }

    // ── DOC (old binary format) — skip, unsupported ────────────────────
    // ── Spreadsheets, presentations — skip for now ─────────────────────

    return "";
  } catch (error) {
    console.error(`Failed to extract content from ${filePath}:`, error);
    return "";
  }
}

/**
 * Check if a file extension is likely to contain extractable text.
 */
export function isContentExtractable(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.has(ext) || ext === "pdf" || ext === "docx";
}
