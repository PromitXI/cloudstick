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

export default function FolderCard({ folder, onNavigate, onDelete, index }: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(folder.path)}
      className="group relative cursor-pointer rounded-2xl border border-[#d6d1c6] bg-[#f8f3e8] p-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
          <FiFolder className="h-6 w-6 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#282620]">{folder.name}</p>
          <p className="text-xs text-zinc-500">Folder</p>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.path, "folder");
            }}
            className="rounded-lg p-2 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
          >
            <FiTrash2 className="h-4 w-4" />
          </motion.button>
          <FiChevronRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-orange-500" />
        </div>
      </div>
    </motion.div>
  );
}
