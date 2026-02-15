"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud, FiCheck, FiX, FiFile } from "react-icons/fi";
import { formatFileSize } from "@/lib/utils";

interface UploadZoneProps {
  currentPath: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

export default function UploadZone({
  currentPath,
  onUploadComplete,
}: UploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", currentPath);

    setUploadingFiles((prev) => [
      ...prev,
      { file, progress: 0, status: "uploading" },
    ]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file && f.status === "uploading"
              ? { ...f, progress: Math.min(f.progress + 15, 90) }
              : f
          )
        );
      }, 200);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, progress: 100, status: "complete" } : f
        )
      );

      // Remove completed file after animation
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
      }, 2000);

      onUploadComplete();
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );

      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
      }, 3000);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => uploadFile(file));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPath]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragActive
            ? "border-blue-400 bg-blue-50/80 dark:bg-blue-950/30"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <motion.div
            animate={
              isDragActive ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div
              className={`rounded-2xl p-4 mb-4 ${
                isDragActive
                  ? "bg-blue-100 dark:bg-blue-900/50"
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30"
              }`}
            >
              <FiUploadCloud
                className={`w-10 h-10 ${
                  isDragActive
                    ? "text-blue-500"
                    : "text-blue-400 dark:text-blue-500"
                }`}
              />
            </div>
          </motion.div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            or click to browse from your computer
          </p>
        </div>

        {/* Animated gradient border when dragging */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Upload Progress */}
      <AnimatePresence mode="popLayout">
        {uploadingFiles.map((upload, index) => (
          <motion.div
            key={`${upload.file.name}-${index}`}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex-shrink-0">
                {upload.status === "complete" ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  >
                    <FiCheck className="w-5 h-5 text-green-500" />
                  </motion.div>
                ) : upload.status === "error" ? (
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FiX className="w-5 h-5 text-red-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FiFile className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(upload.file.size)}
                  {upload.error && (
                    <span className="text-red-400 ml-2">{upload.error}</span>
                  )}
                </p>
              </div>
              {upload.status === "uploading" && (
                <div className="w-24">
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${upload.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
