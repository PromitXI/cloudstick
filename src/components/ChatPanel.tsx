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
        'Hi! I am your 42Drive file assistant. Ask me to find files, for example: "find my PDFs" or "show recent images".',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleDownload = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error("Download failed");
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      console.error("Download error");
    }
  }, []);

  const sendQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
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
            content: "Sorry, I ran into an issue. Please try asking again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const sendMessage = useCallback(async () => {
    await sendQuery(input);
  }, [input, sendQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFileBadge = (ext: string) => {
    const clean = (ext || "FILE").replace(".", "").toUpperCase();
    return clean.slice(0, 4);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#101115] text-[#f8f6ef] shadow-lg shadow-black/30 transition-shadow hover:shadow-xl"
            aria-label="Open file assistant"
          >
            <FiMessageCircle className="h-6 w-6" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[#d6d1c6] bg-[#f8f6ef] shadow-2xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#101115] px-4 py-3 text-[#f8f6ef]">
              <div className="flex items-center gap-2">
                <FiSearch className="h-5 w-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-semibold">Find My Files</h3>
                  <p className="text-[10px] text-zinc-300">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-white/15"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-[#101115] text-[#f8f6ef]"
                        : "rounded-bl-md border border-[#d9d3c7] bg-white text-zinc-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {msg.results.map((file, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group flex items-center gap-2 rounded-lg border border-[#ddd6c8] bg-[#fdfcf8] px-2.5 py-2 transition-colors hover:border-orange-300"
                          >
                            <span className="grid h-6 min-w-6 place-items-center rounded bg-[#f1ece1] px-1 text-[10px] font-bold text-zinc-600">
                              {getFileBadge(file.extension)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-zinc-800">{file.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                <span className="flex items-center gap-0.5">
                                  <FiFolder className="h-2.5 w-2.5" />
                                  {file.folder || "/"}
                                </span>
                                <span>{formatFileSize(file.size)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownload(file.path)}
                              className="rounded-md p-1.5 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-[#f7efe3] hover:text-orange-600"
                              title="Download"
                            >
                              <FiDownload className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-[#d9d3c7] bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      >
                        <FiSearch className="h-4 w-4 text-orange-500" />
                      </motion.div>
                      <span>Searching your files...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {["Show recent files", "Find PDFs", "Large files", "Images this week"].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuery(q)}
                      className="rounded-full border border-[#d6d1c6] px-2.5 py-1 text-[11px] text-zinc-600 transition-colors hover:border-orange-300 hover:bg-[#f8f1e6] hover:text-orange-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#d6d1c6] px-3 py-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your files..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-[#d6d1c6] bg-white px-3.5 py-2.5 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl bg-[#101115] p-2.5 text-[#f8f6ef] transition-colors hover:bg-[#1d1d20] disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  <FiSend className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
