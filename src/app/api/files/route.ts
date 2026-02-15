import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listFiles, getStorageUsage } from "@/lib/azure-storage";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path") || "";

  try {
    const [{ files, folders }, usage] = await Promise.all([
      listFiles(session.user.id, path),
      getStorageUsage(session.user.id),
    ]);

    return NextResponse.json({
      files: files.filter((f) => f.name !== ".folder"),
      folders,
      usage,
      currentPath: path,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
