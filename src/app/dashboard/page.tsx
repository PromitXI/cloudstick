"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FileExplorer from "@/components/FileExplorer";
import ChatPanel from "@/components/ChatPanel";
import BrandIcon from "@/components/BrandIcon";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111113]">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
            className="grid h-12 w-12 place-items-center rounded-xl border border-[#d6d1c6] bg-[#f8f6ef]"
          >
            <BrandIcon size={24} />
          </motion.div>
          <p className="text-sm text-zinc-400">Loading your cloud...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111113] p-2 sm:p-3">
      <div className="relative min-h-[calc(100vh-1rem)] overflow-hidden rounded-[20px] border border-zinc-700/40 bg-[#ececec] sm:min-h-[calc(100vh-1.5rem)]">
        <div className="pointer-events-none absolute inset-0 opacity-45">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(24,24,27,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.07) 1px, transparent 1px)",
              backgroundSize: "110px 110px",
            }}
          />
        </div>

        <div className="relative z-10">
          <Navbar />
          <main className="px-4 py-8 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-8 max-w-6xl"
            >
              <h2 className="text-2xl font-black tracking-tight text-[#171613]">
                Welcome back, <span className="text-orange-600">{session.user?.name?.split(" ")[0]}</span>!
              </h2>
              <p className="mt-1 text-sm text-zinc-600">Manage your files and folders</p>
            </motion.div>

            <FileExplorer />
          </main>
        </div>

        <ChatPanel />
      </div>
    </div>
  );
}
