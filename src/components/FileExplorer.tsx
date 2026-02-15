"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiChevronRight,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiGrid,
  FiList,
  FiX,
  FiFolder,
} from "react-icons/fi";
import UploadZone from "./UploadZone";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";
import { FileItem, FolderItem } from "@/lib/azure-storage";
import { formatFileSize } from "@/lib/utils";

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setFolders(data.folders);
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshKey]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path.endsWith("/") ? path : `${path}/`);
  };

  const handleGoHome = () => {
    setCurrentPath("");
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const { url } = await response.json();
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDelete = async (path: string, type: "file" | "folder") => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, type }),
      });
      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleMoveFile = async (filePath: string, destinationFolder: string) => {
    try {
      const response = await fetch("/api/files/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePath: filePath, destinationFolder }),
      });
      if (response.ok) {
        fetchFiles();
      } else {
        console.error("Move failed");
      }
    } catch (error) {
      console.error("Move failed:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/files/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName.trim(),
        }),
      });
      if (response.ok) {
        setNewFolderName("");
        setIsCreatingFolder(false);
        fetchFiles();
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const breadcrumbs = currentPath
    .split("/")
    .filter(Boolean)
    .map((part, index, arr) => ({
      name: part,
      path: `${arr.slice(0, index + 1).join("/")}/`,
    }));

  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-[#d6d1c6] bg-[#f8f6ef] p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#3b3934]">Storage Used</span>
          <span className="text-sm font-bold text-orange-600">{formatFileSize(usage)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e0d9cb]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min((usage / (5 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      <div className="mb-6">
        <UploadZone currentPath={currentPath} onUploadComplete={() => setRefreshKey((k) => k + 1)} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-[#f8f3e8] hover:text-orange-600"
          >
            <FiHome className="h-4 w-4" />
          </motion.button>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-1">
              <FiChevronRight className="h-3 w-3 text-zinc-400" />
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleNavigate(crumb.path)}
                className={`rounded-lg px-2 py-1 text-sm transition-colors ${
                  i === breadcrumbs.length - 1
                    ? "bg-[#f8f3e8] font-semibold text-orange-600"
                    : "text-zinc-600 hover:bg-[#f6f2ea] hover:text-zinc-800"
                }`}
              >
                {crumb.name}
              </motion.button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 rounded-xl border border-[#d6d1c6] bg-[#f8f6ef] py-2 pl-9 pr-3 text-sm text-zinc-700 placeholder-zinc-400 transition-all focus:w-52 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60"
            />
          </div>

          <div className="flex items-center rounded-xl border border-[#d6d1c6] bg-[#f8f6ef] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition-all ${
                viewMode === "grid" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <FiGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition-all ${
                viewMode === "list" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <FiList className="h-4 w-4" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-2 rounded-xl bg-[#101115] px-4 py-2 text-sm font-medium text-[#f8f6ef] shadow-lg transition hover:bg-[#1f1f22]"
          >
            <FiPlus className="h-4 w-4 text-orange-400" />
            <span className="hidden sm:inline">New Folder</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-[#f8f3e8] hover:text-orange-600"
          >
            <FiRefreshCw className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isCreatingFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl border border-[#d6d1c6] bg-[#f8f6ef] p-3 shadow-sm">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
                className="flex-1 rounded-lg border border-[#d6d1c6] bg-white px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateFolder}
                className="rounded-lg bg-[#101115] px-4 py-2 text-sm font-medium text-[#f8f6ef]"
              >
                Create
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-[#f6f2ea]"
              >
                <FiX className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <FiRefreshCw className="h-8 w-8 text-orange-500" />
          </motion.div>
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-[#f8f3e8]">
            <FiFolder className="h-10 w-10 text-orange-400" />
          </div>
          <p className="mb-1 text-lg font-semibold text-zinc-600">
            {searchQuery ? "No matches found" : "This folder is empty"}
          </p>
          <p className="text-sm text-zinc-500">
            {searchQuery ? "Try a different search term" : "Upload files or create a folder to get started"}
          </p>
        </motion.div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}>
          <AnimatePresence mode="popLayout">
            {filteredFolders.map((folder, index) => (
              <FolderCard
                key={folder.path}
                folder={folder}
                onNavigate={handleNavigate}
                onDelete={handleDelete}
                onFileDrop={handleMoveFile}
                index={index}
              />
            ))}
            {filteredFiles.map((file, index) => (
              <FileCard
                key={file.path}
                file={file}
                onDownload={handleDownload}
                onDelete={handleDelete}
                index={filteredFolders.length + index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
