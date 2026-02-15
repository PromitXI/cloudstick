import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchFiles, getAllUserFiles } from "@/lib/file-search";
import {
  parseUserIntent,
  summarizeResults,
  checkGuardrail,
  classifyQuery,
  answerFromDocuments,
} from "@/lib/gemini";
import { extractFileContent, isContentExtractable } from "@/lib/document-reader";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "A search query is required" },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // ── Step 0: Guardrail — reject off-topic queries ──────────────────
    const isAllowed = await checkGuardrail(trimmedQuery);
    if (!isAllowed) {
      return NextResponse.json({
        summary:
          "I'm your 42Drive file assistant — I can only help with questions about your uploaded files and documents. Try asking me to find files, search your documents, or answer questions about your uploaded content!",
        results: [],
        intent: "off-topic",
        totalFiles: 0,
        filtersApplied: {},
      });
    }

    // ── Step 1: Classify — file search vs content question ────────────
    const classification = await classifyQuery(trimmedQuery);

    if (classification.type === "content_question") {
      // ── Content Q&A flow ────────────────────────────────────────────
      // Find relevant files first
      const searchKeywords = classification.searchKeywords;
      const { filters } = await parseUserIntent(trimmedQuery);
      // Merge classification keywords with parsed keywords
      if (searchKeywords.length > 0) {
        filters.keywords = [
          ...new Set([...(filters.keywords || []), ...searchKeywords]),
        ];
      }

      const results = await searchFiles(session.user.id, filters, 5);
      const allFiles = await getAllUserFiles(session.user.id);

      // Read content from the top matching files
      const documentContents: { fileName: string; content: string }[] = [];
      for (const file of results) {
        if (isContentExtractable(file.path)) {
          const content = await extractFileContent(session.user.id, file.path);
          if (content) {
            documentContents.push({ fileName: file.name, content });
          }
        }
        // Limit to 3 documents to keep context manageable
        if (documentContents.length >= 3) break;
      }

      if (documentContents.length === 0) {
        return NextResponse.json({
          summary:
            "I found some files that might be relevant, but I couldn't read their contents. I can currently read PDF, DOCX, and text-based files. Try uploading documents in those formats!",
          results: results.map((r) => ({
            name: r.name,
            path: r.path,
            folder: r.folder,
            extension: r.extension,
            size: r.size,
            contentType: r.contentType,
            lastModified: r.lastModified,
            score: Math.round(r.score * 100),
            reason: r.reason,
          })),
          intent: "content_question",
          totalFiles: allFiles.length,
          filtersApplied: filters,
        });
      }

      // Answer from document contents
      const answer = await answerFromDocuments(trimmedQuery, documentContents);

      return NextResponse.json({
        summary: answer,
        results: results.map((r) => ({
          name: r.name,
          path: r.path,
          folder: r.folder,
          extension: r.extension,
          size: r.size,
          contentType: r.contentType,
          lastModified: r.lastModified,
          score: Math.round(r.score * 100),
          reason: r.reason,
        })),
        intent: "content_question",
        totalFiles: allFiles.length,
        filtersApplied: filters,
      });
    }

    // ── File search flow (original) ───────────────────────────────────
    const { filters, userIntent } = await parseUserIntent(trimmedQuery);

    const results = await searchFiles(session.user.id, filters, 10);

    const allFiles = await getAllUserFiles(session.user.id);
    const totalFiles = allFiles.length;

    const summary = await summarizeResults(
      trimmedQuery,
      userIntent,
      results,
      totalFiles
    );

    return NextResponse.json({
      summary,
      results: results.map((r) => ({
        name: r.name,
        path: r.path,
        folder: r.folder,
        extension: r.extension,
        size: r.size,
        contentType: r.contentType,
        lastModified: r.lastModified,
        score: Math.round(r.score * 100),
        reason: r.reason,
      })),
      intent: userIntent,
      totalFiles,
      filtersApplied: filters,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process your query. Please try again." },
      { status: 500 }
    );
  }
}
