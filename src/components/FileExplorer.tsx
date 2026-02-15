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
      const response = await fetch(
        `/api/files?path=${encodeURIComponent(currentPath)}`
      );
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
    setCurrentPath(path.endsWith("/") ? path : path + "/");
  };

  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join("/") + "/" : "");
  };

  const handleGoHome = () => {
    setCurrentPath("");
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(
        `/api/files/download?path=${encodeURIComponent(filePath)}`
      );
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
    if (
      !confirm(
        `Are you sure you want to delete this ${type}? This action cannot be undone.`
      )
    ) {
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
      path: arr.slice(0, index + 1).join("/") + "/",
    }));

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Storage Usage Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/30"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Storage Used
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {formatFileSize(usage)}
          </span>
        </div>
        <div className="h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: `${Math.min((usage / (5 * 1024 * 1024 * 1024)) * 100, 100)}%`,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Upload Zone */}
      <div className="mb-6">
        <UploadZone
          currentPath={currentPath}
          onUploadComplete={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <FiHome className="w-4 h-4" />
          </motion.button>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-1">
              <FiChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleNavigate(crumb.path)}
                className={`px-2 py-1 rounded-lg text-sm transition-colors ${
                  i === breadcrumbs.length - 1
                    ? "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {crumb.name}
              </motion.button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all w-40 focus:w-52"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* New Folder */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 hover:shadow-xl transition-shadow"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Folder</span>
          </motion.button>

          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* New Folder Dialog */}
      <AnimatePresence>
        {isCreatingFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateFolder}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
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
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <FiX className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File & Folder Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <FiRefreshCw className="w-8 h-8 text-blue-400" />
          </motion.div>
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
            <span className="text-4xl">📁</span>
          </div>
          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
            {searchQuery ? "No matches found" : "This folder is empty"}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {searchQuery
              ? "Try a different search term"
              : "Upload files or create a folder to get started"}
          </p>
        </motion.div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              : "flex flex-col gap-2"
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredFolders.map((folder, index) => (
              <FolderCard
                key={folder.path}
                folder={folder}
                onNavigate={handleNavigate}
                onDelete={handleDelete}
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
