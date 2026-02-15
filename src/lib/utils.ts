export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function getFileIcon(contentType: string, fileName: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("zip") || contentType.includes("compressed") || contentType.includes("archive"))
    return "📦";
  if (contentType.includes("spreadsheet") || fileName.endsWith(".xlsx") || fileName.endsWith(".csv"))
    return "📊";
  if (contentType.includes("presentation") || fileName.endsWith(".pptx"))
    return "📽️";
  if (contentType.includes("document") || fileName.endsWith(".docx") || fileName.endsWith(".doc"))
    return "📝";
  if (contentType.includes("text") || fileName.endsWith(".txt"))
    return "📃";
  if (fileName.endsWith(".json") || fileName.endsWith(".xml"))
    return "🔧";
  if (
    fileName.endsWith(".js") ||
    fileName.endsWith(".ts") ||
    fileName.endsWith(".py") ||
    fileName.endsWith(".java")
  )
    return "💻";
  return "📎";
}

export function getFileColor(contentType: string): string {
  if (contentType.startsWith("image/")) return "from-pink-500 to-rose-500";
  if (contentType.startsWith("video/")) return "from-purple-500 to-indigo-500";
  if (contentType.startsWith("audio/")) return "from-green-500 to-emerald-500";
  if (contentType.includes("pdf")) return "from-red-500 to-orange-500";
  if (contentType.includes("zip")) return "from-yellow-500 to-amber-500";
  if (contentType.includes("spreadsheet")) return "from-emerald-500 to-teal-500";
  return "from-blue-500 to-cyan-500";
}
