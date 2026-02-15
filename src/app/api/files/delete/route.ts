import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteFile, deleteFolder } from "@/lib/azure-storage";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { path, type } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    if (type === "folder") {
      await deleteFolder(session.user.id, path);
    } else {
      await deleteFile(session.user.id, path);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
