import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchFiles, getAllUserFiles } from "@/lib/file-search";
import { parseUserIntent, summarizeResults } from "@/lib/gemini";

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

    // 1. Parse user intent via Gemini → structured filters
    const { filters, userIntent } = await parseUserIntent(trimmedQuery);

    // 2. Search Azure metadata with the structured filters
    const results = await searchFiles(session.user.id, filters, 10);

    // 3. Get total file count for context
    const allFiles = await getAllUserFiles(session.user.id);
    const totalFiles = allFiles.length;

    // 4. Summarize results via Gemini
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
