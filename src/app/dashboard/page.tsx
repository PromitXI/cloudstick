"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiCloud } from "react-icons/fi";
import Navbar from "@/components/Navbar";
import FileExplorer from "@/components/FileExplorer";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <FiCloud className="w-12 h-12 text-blue-500" />
          </motion.div>
          <p className="text-sm text-gray-400">Loading your cloud...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-6xl mx-auto mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {session.user?.name?.split(" ")[0]}
            </span>
            !
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Manage your files and folders
          </p>
        </motion.div>
        <FileExplorer />
      </main>
    </div>
  );
}
