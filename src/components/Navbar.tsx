"use client";

import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FiLogOut, FiCloud, FiUser } from "react-icons/fi";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30">
                <FiCloud className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                42Drive
              </h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5 tracking-wider uppercase">
                Personal Cloud
              </p>
            </div>
          </motion.div>

          {/* User Info */}
          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {session.user.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {session.user.email}
                </span>
              </div>
              <div className="relative">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={36}
                    height={36}
                    className="rounded-xl border-2 border-gray-100 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                title="Sign out"
              >
                <FiLogOut className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
