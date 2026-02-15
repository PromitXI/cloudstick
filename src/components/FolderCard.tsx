"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiFolder, FiTrash2, FiChevronRight } from "react-icons/fi";
import { FolderItem } from "@/lib/azure-storage";
import React from "react";

interface FolderCardProps {
  folder: FolderItem;
  onNavigate: (path: string) => void;
  onDelete: (path: string, type: "folder") => void;
  onFileDrop?: (filePath: string, destinationFolder: string) => void;
  index: number;
}

export default function FolderCard({ folder, onNavigate, onDelete, onFileDrop, index }: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/42drive-file")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const data = e.dataTransfer.getData("application/42drive-file");
    if (data && onFileDrop) {
      const { path } = JSON.parse(data);
      onFileDrop(path, folder.path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(folder.path)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 ${
        isDragOver
          ? "border-orange-400 bg-orange-50 shadow-lg shadow-orange-200/40 scale-[1.03]"
          : "border-[#d6d1c6] bg-[#f8f3e8]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-md transition-colors ${
          isDragOver
            ? "bg-gradient-to-br from-orange-400 to-amber-400"
            : "bg-gradient-to-br from-orange-500 to-amber-500"
        }`}>
          <FiFolder className="h-6 w-6 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#282620]">{folder.name}</p>
          <p className="text-xs text-zinc-500">
            {isDragOver ? "Drop file here" : "Folder"}
          </p>
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
