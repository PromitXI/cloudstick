/**
 * Gemini-powered intent parser, guardrails, and result summarizer.
 * 
 * Flow:
 *   1. User asks natural language query
 *   2. Guardrail check: is the query related to files/documents?
 *   3. Classify: "file_search" (find files) vs "content_question" (ask about file contents)
 *   4. For file_search: parse → search → summarize
 *   5. For content_question: find relevant files → read contents → answer using Gemini
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

// ── Guardrails ───────────────────────────────────────────────────────────────

const GUARDRAIL_PROMPT = `You are a strict guardrail for 42Drive, a personal cloud storage app.
Your ONLY job is to decide if the user's message is related to their uploaded files and documents.

ALLOWED topics (respond "ALLOWED"):
- Finding, searching, listing files or folders
- Asking about file details (size, date, type, location)
- Asking questions ABOUT THE CONTENT of their uploaded documents (e.g. "What is the IP address in the HLD?", "Summarize my report", "What does the contract say about pricing?")
- Managing files (move, organize, delete requests)
- Storage usage questions
- Anything referencing their documents, files, folders, uploads

BLOCKED topics (respond "BLOCKED"):
- Weather, news, sports, politics, entertainment
- Flirting, personal conversation, jokes, riddles
- General knowledge questions NOT about their documents (e.g. "What is the capital of France?")
- Coding help, math problems, homework
- Anything completely unrelated to their stored files

Respond with EXACTLY one word: "ALLOWED" or "BLOCKED". Nothing else.`;

export async function checkGuardrail(query: string): Promise<boolean> {
  try {
    const model = getModel();
    const result = await model.generateContent([
      { text: GUARDRAIL_PROMPT },
      { text: `User message: "${query}"` },
    ]);
    const verdict = result.response.text().trim().toUpperCase();
    return verdict.includes("ALLOWED");
  } catch {
    // If guardrail fails, default to allowing (don't block legitimate queries)
    return true;
  }
}

// ── Query classification ─────────────────────────────────────────────────────

const CLASSIFY_PROMPT = `You classify user queries for 42Drive (cloud storage app) into exactly one category.

"file_search" — The user wants to FIND or LIST files. Examples:
- "Find my PDFs"
- "Show recent images"  
- "Is there any HLD file?"
- "Do I have any spreadsheets?"

"content_question" — The user wants to know something INSIDE a document's content. Examples:
- "What is the IP address for Mazumo?"
- "What does the HLD say about the architecture?"
- "Summarize the project proposal"
- "What are the key findings in the report?"
- "Give me the server details from the documentation"

Respond with ONLY valid JSON: {"type": "file_search" or "content_question", "searchKeywords": ["relevant", "keywords", "to", "find", "the", "file"]}
The searchKeywords should help find the RELEVANT FILE(s) the user is asking about. Expand abbreviations.`;

export interface QueryClassification {
  type: "file_search" | "content_question";
  searchKeywords: string[];
}

export async function classifyQuery(query: string): Promise<QueryClassification> {
  try {
    const model = getModel();
    const result = await model.generateContent([
      { text: CLASSIFY_PROMPT },
      { text: `User query: "${query}"` },
    ]);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(text);
    return {
      type: parsed.type === "content_question" ? "content_question" : "file_search",
      searchKeywords: parsed.searchKeywords || [],
    };
  } catch {
    return { type: "file_search", searchKeywords: [] };
  }
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
- CRITICAL: Expand ALL abbreviations and acronyms into their full forms AND keep the abbreviation as a keyword. Common examples:
  - HLD → include ["HLD", "high", "level", "design", "documentation"]
  - LLD → include ["LLD", "low", "level", "design"]
  - SRS → include ["SRS", "software", "requirements", "specification"]
  - BRD → include ["BRD", "business", "requirements", "document"]
  - PRD → include ["PRD", "product", "requirements"]
  - UAT → include ["UAT", "user", "acceptance", "testing"]
  - API → include ["API", "interface"]
  - SOW → include ["SOW", "statement", "work"]
  - SLA → include ["SLA", "service", "level", "agreement"]
  Apply this logic to ANY abbreviation, not just these examples.
- When the user mentions concepts like "documentation", "design docs", "specs", include related keywords: ["doc", "documentation", "design", "spec", "HLD", "LLD", "SRS"].
- If the user says "photos" or "pictures", set contentTypes to ["image"].
- If the user says "documents" or "documentation" or "files", set contentTypes to ["document"].
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

// ── Document content Q&A ─────────────────────────────────────────────────────

const CONTENT_QA_PROMPT = `You are 42Drive's document assistant. The user asked a question and we retrieved content from their uploaded documents.

RULES:
- Answer the user's question ONLY based on the document content provided below.
- If the answer is found in the documents, give a clear, specific answer and mention which document it came from.
- If the answer is NOT in the provided documents, say so honestly.
- Be concise and direct. Do NOT use markdown formatting.
- Do NOT make up information that isn't in the documents.
- Use emoji sparingly (1-2 max).`;

export async function answerFromDocuments(
  query: string,
  documentContents: { fileName: string; content: string }[]
): Promise<string> {
  try {
    const model = getModel();

    const docsText = documentContents
      .map((d, i) => `--- Document ${i + 1}: "${d.fileName}" ---\n${d.content}\n`)
      .join("\n");

    const prompt = `User question: "${query}"

Here are the contents of the user's relevant documents:

${docsText}

Answer the user's question based ONLY on the information in these documents.`;

    const result = await model.generateContent([
      { text: CONTENT_QA_PROMPT },
      { text: prompt },
    ]);
    return result.response.text().trim();
  } catch (error) {
    console.error("Document Q&A failed:", error);
    return "Sorry, I had trouble reading your documents. Please try again.";
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
