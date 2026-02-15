/**
 * Gemini-powered intent parser and result summarizer.
 * 
 * Flow:
 *   1. User asks natural language query ("find invoices from last month")
 *   2. Gemini parses intent → structured SearchFilters
 *   3. file-search runs the filters against Azure metadata
 *   4. Gemini summarizes the results for the user
 * 
 * The Gemini API key lives server-side only (GEMINI_API_KEY env var).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SearchFilters, FileMetadata } from "./file-search";

const geminiApiKey = process.env.GEMINI_API_KEY;

function getModel() {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ── Intent parsing ───────────────────────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are a file search assistant for 42Drive, a personal cloud storage app.
Your job is to parse the user's natural language query into structured search filters.

Return ONLY valid JSON (no markdown, no backticks, no extra text) matching this schema:
{
  "keywords": ["string array of search terms extracted from the query"],
  "extensions": ["file extensions without dots, e.g. pdf, docx, jpg — only if user explicitly mentions file types"],
  "contentTypes": ["general categories: document, spreadsheet, presentation, image, video, audio, archive, code — only if user mentions a category"],
  "folders": ["folder names if user mentions specific folders"],
  "minSize": null or number in bytes (only if user mentions size),
  "maxSize": null or number in bytes (only if user mentions size),
  "modifiedAfter": "ISO date string or null (if user says 'last week', 'last month', compute relative to today)",
  "modifiedBefore": "ISO date string or null",
  "userIntent": "brief one-line summary of what the user wants"
}

Today's date is: ${new Date().toISOString().split("T")[0]}

Rules:
- Always include relevant keywords extracted from the query.
- If the user says "photos" or "pictures", set contentTypes to ["image"].
- If the user says "documents", set contentTypes to ["document"].
- If the user says "videos", set contentTypes to ["video"].
- "last month" means modifiedAfter = first day of previous month, modifiedBefore = first day of current month.
- "last week" means modifiedAfter = 7 days ago.
- "recent" or "latest" means modifiedAfter = 30 days ago.
- If the user says "large files" or "big files", set minSize to 10485760 (10MB).
- Only set filters the user actually implies. Don't guess.
- Return ONLY the JSON object. No explanation.`;

export interface ParsedIntent {
  filters: SearchFilters;
  userIntent: string;
}

export async function parseUserIntent(query: string): Promise<ParsedIntent> {
  try {
    const model = getModel();
    const result = await model.generateContent([
      { text: INTENT_SYSTEM_PROMPT },
      { text: `User query: "${query}"` },
    ]);
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps them
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      filters: {
        keywords: parsed.keywords || [],
        extensions: parsed.extensions || [],
        contentTypes: parsed.contentTypes || [],
        folders: parsed.folders || [],
        minSize: parsed.minSize ?? undefined,
        maxSize: parsed.maxSize ?? undefined,
        modifiedAfter: parsed.modifiedAfter || undefined,
        modifiedBefore: parsed.modifiedBefore || undefined,
      },
      userIntent: parsed.userIntent || query,
    };
  } catch (error) {
    console.error("Gemini intent parsing failed, falling back to keyword search:", error);
    // Fallback: treat the whole query as keywords
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    return {
      filters: { keywords },
      userIntent: query,
    };
  }
}

// ── Result summarization ─────────────────────────────────────────────────────

const SUMMARY_SYSTEM_PROMPT = `You are 42Drive's friendly file assistant. The user searched for files and got results.
Summarize the findings conversationally in 2-4 sentences. Mention the most relevant files by name.
If no results were found, suggest what the user might try instead (different keywords, checking folder names, etc.).
Keep it concise, helpful, and warm. Use emoji sparingly (1-2 max). Do NOT use markdown formatting.`;

export async function summarizeResults(
  query: string,
  intent: string,
  results: FileMetadata[],
  totalFilesScanned: number
): Promise<string> {
  try {
    const model = getModel();

    const fileList =
      results.length > 0
        ? results
            .slice(0, 8)
            .map(
              (f, i) =>
                `${i + 1}. "${f.name}" in /${f.folder} (${f.extension}, ${formatSize(f.size)}, modified ${f.lastModified.split("T")[0]}) — ${f.reason}`
            )
            .join("\n")
        : "No matching files found.";

    const prompt = `User asked: "${query}"
Interpreted intent: ${intent}
Total files scanned: ${totalFilesScanned}
Results found: ${results.length}

Files:
${fileList}

Provide a brief, friendly summary of these results.`;

    const result = await model.generateContent([
      { text: SUMMARY_SYSTEM_PROMPT },
      { text: prompt },
    ]);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini summarization failed:", error);
    // Fallback summary
    if (results.length === 0) {
      return `I couldn't find any files matching "${query}". Try different keywords or check your folder names.`;
    }
    return `Found ${results.length} file${results.length > 1 ? "s" : ""} matching your search. The top result is "${results[0].name}".`;
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
