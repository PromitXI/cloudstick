"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiDownload,
  FiFolder,
  FiSearch,
} from "react-icons/fi";
import { formatFileSize } from "@/lib/utils";

interface FileResult {
  name: string;
  path: string;
  folder: string;
  extension: string;
  size: number;
  contentType: string;
  lastModified: string;
  score: number;
  reason: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: FileResult[];
  totalFiles?: number;
  timestamp: Date;
}

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'Hi! I\'m your 42Drive file assistant. Ask me to find files — try something like "find my PDFs" or "show recent images".',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleDownload = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(
        `/api/files/download?path=${encodeURIComponent(filePath)}`
      );
      if (!res.ok) throw new Error("Download failed");
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      console.error("Download error");
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.summary,
        results: data.results,
        totalFiles: data.totalFiles,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I ran into an issue. Please try asking again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFileEmoji = (ext: string) => {
    const map: Record<string, string> = {
      pdf: "📄",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      mp4: "🎬",
      mp3: "🎵",
      doc: "📝",
      docx: "📝",
      xls: "📊",
      xlsx: "📊",
      csv: "📊",
      pptx: "📽️",
      zip: "📦",
      txt: "📃",
      json: "🔧",
      py: "💻",
      js: "💻",
      ts: "💻",
    };
    return map[ext.toLowerCase()] || "📎";
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/40 transition-shadow"
            aria-label="Open file assistant"
          >
            <FiMessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <FiSearch className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-semibold">Find My Files</h3>
                  <p className="text-[10px] text-blue-100 opacity-80">
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* File Results */}
                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {msg.results.map((file, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-2 bg-white dark:bg-gray-700/50 rounded-lg px-2.5 py-2 border border-gray-200 dark:border-gray-600/50 group hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                          >
                            <span className="text-base flex-shrink-0">
                              {getFileEmoji(file.extension)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <span className="flex items-center gap-0.5">
                                  <FiFolder className="w-2.5 h-2.5" />
                                  {file.folder || "/"}
                                </span>
                                <span>{formatFileSize(file.size)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownload(file.path)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                              title="Download"
                            >
                              <FiDownload className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          ease: "linear",
                        }}
                      >
                        <FiSearch className="w-4 h-4" />
                      </motion.div>
                      <span>Searching your files...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Suggested Queries */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Show recent files",
                    "Find PDFs",
                    "Large files",
                    "Images this week",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => {
                          setInput(q);
                          sendMessage();
                        }, 50);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your files..."
                  disabled={isLoading}
                  className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 dark:text-gray-200 placeholder-gray-400 disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  <FiSend className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
