import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createFolder } from "@/lib/azure-storage";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { path, name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const folderPath = path ? `${path}${name}` : name;
    await createFolder(session.user.id, folderPath);

    return NextResponse.json({
      success: true,
      folder: { name, path: folderPath },
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
