import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { moveFile } from "@/lib/azure-storage";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourcePath, destinationFolder } = await request.json();

    if (!sourcePath || typeof sourcePath !== "string") {
      return NextResponse.json({ error: "sourcePath is required" }, { status: 400 });
    }

    // Compute destination path
    const fileName = sourcePath.split("/").pop()!;
    const destPath = destinationFolder
      ? `${destinationFolder.replace(/\/$/, "")}/${fileName}`
      : fileName;

    if (sourcePath === destPath) {
      return NextResponse.json({ error: "Source and destination are the same" }, { status: 400 });
    }

    await moveFile(session.user.id, sourcePath, destPath);

    return NextResponse.json({ success: true, newPath: destPath });
  } catch (error) {
    console.error("Move file error:", error);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
}
