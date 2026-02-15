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

export default function FileCard({
  file,
  onDownload,
  onDelete,
  index,
}: FileCardProps) {
  const icon = getFileIcon(file.contentType, file.name);
  const colorClass = getFileColor(file.contentType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 p-4 hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-gray-900/30 transition-shadow duration-300"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg shadow-gray-200/50 dark:shadow-gray-900/30`}
        >
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.lastModified)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDownload(file.path, file.name)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500"
            title="Download"
          >
            <FiDownload className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(file.path, "file")}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
