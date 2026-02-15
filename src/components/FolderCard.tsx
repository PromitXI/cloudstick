"use client";

import { motion } from "framer-motion";
import { FiFolder, FiTrash2, FiChevronRight } from "react-icons/fi";
import { FolderItem } from "@/lib/azure-storage";

interface FolderCardProps {
  folder: FolderItem;
  onNavigate: (path: string) => void;
  onDelete: (path: string, type: "folder") => void;
  index: number;
}

export default function FolderCard({
  folder,
  onNavigate,
  onDelete,
  index,
}: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(folder.path)}
      className="group relative cursor-pointer rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30 p-4 hover:shadow-lg hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-shadow duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30">
          <FiFolder className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {folder.name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Folder</p>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.path, "folder");
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
          >
            <FiTrash2 className="w-4 h-4" />
          </motion.button>
          <FiChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-amber-500 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
