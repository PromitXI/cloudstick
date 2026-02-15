"use client";

import { motion } from "framer-motion";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import { FileItem } from "@/lib/azure-storage";
import { formatFileSize, formatDate, getFileIcon, getFileColor } from "@/lib/utils";

interface FileCardProps {
  file: FileItem;
  onDownload: (path: string, name: string) => void;
  onDelete: (path: string, type: "file") => void;
  index: number;
}

export default function FileCard({ file, onDownload, onDelete, index }: FileCardProps) {
  const icon = getFileIcon(file.contentType, file.name);
  const colorClass = getFileColor(file.contentType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative rounded-2xl border border-[#d6d1c6] bg-[#f8f6ef] p-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/10"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass} shadow-md`}
        >
          <span className="text-xl">{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#282620]">{file.name}</p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>{formatFileSize(file.size)}</span>
            <span>/</span>
            <span>{formatDate(file.lastModified)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDownload(file.path, file.name)}
            className="rounded-lg p-2 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#f6efe3] hover:text-orange-600"
            title="Download"
          >
            <FiDownload className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(file.path, "file")}
            className="rounded-lg p-2 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
            title="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
