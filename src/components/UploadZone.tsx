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

export default function UploadZone({ currentPath, onUploadComplete }: UploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", currentPath);

    setUploadingFiles((prev) => [...prev, { file, progress: 0, status: "uploading" }]);

    try {
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
        prev.map((f) => (f.file === file ? { ...f, progress: 100, status: "complete" } : f))
      );

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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragActive
            ? "border-orange-400 bg-[#fdf4ea]"
            : "border-[#d6d1c6] bg-[#f8f6ef]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center px-6 py-10">
          <motion.div
            animate={isDragActive ? { y: -8, scale: 1.08 } : { y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={`mb-4 rounded-2xl p-4 ${isDragActive ? "bg-orange-100" : "bg-[#f2ede3]"}`}>
              <FiUploadCloud className={`h-10 w-10 ${isDragActive ? "text-orange-500" : "text-[#3a3832]"}`} />
            </div>
          </motion.div>
          <p className="mb-1 text-lg font-semibold text-[#2e2b25]">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="mb-4 text-sm text-zinc-500">or use the button below</p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); open(); }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200/50 transition-shadow hover:shadow-lg hover:shadow-orange-300/50"
          >
            <FiUploadCloud className="h-4 w-4" />
            Browse Files
          </motion.button>
        </div>

        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.11), rgba(245,158,11,0.08))" }}
            />
          )}
        </AnimatePresence>
      </div>

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
            <div className="flex items-center gap-3 rounded-xl border border-[#d6d1c6] bg-[#f8f6ef] p-3 shadow-sm">
              <div className="flex-shrink-0">
                {upload.status === "complete" ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-green-100"
                  >
                    <FiCheck className="h-5 w-5 text-green-600" />
                  </motion.div>
                ) : upload.status === "error" ? (
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100">
                    <FiX className="h-5 w-5 text-red-600" />
                  </div>
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#efe8da]">
                    <FiFile className="h-5 w-5 text-[#3a3832]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#2e2b25]">{upload.file.name}</p>
                <p className="text-xs text-zinc-500">
                  {formatFileSize(upload.file.size)}
                  {upload.error && <span className="ml-2 text-red-500">{upload.error}</span>}
                </p>
              </div>
              {upload.status === "uploading" && (
                <div className="w-24">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#ddd5c7]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
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
