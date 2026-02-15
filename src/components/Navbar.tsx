"use client";

import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FiLogOut, FiUser } from "react-icons/fi";
import Image from "next/image";
import BrandIcon from "@/components/BrandIcon";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-[#d6d1c6] bg-[#ececec]/95 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-3">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#d6d1c6] bg-[#f8f6ef] shadow-md">
                <BrandIcon size={20} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#ececec] bg-orange-500" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[#181714]">42Drive</h1>
              <p className="-mt-0.5 text-[10px] uppercase tracking-[0.15em] text-zinc-500">Personal Cloud</p>
            </div>
          </motion.div>

          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold text-[#2a2823]">{session.user.name}</span>
                <span className="text-xs text-zinc-500">{session.user.email}</span>
              </div>

              <div className="relative">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={36}
                    height={36}
                    className="rounded-xl border border-[#d4cec2]"
                  />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d6d1c6]">
                    <FiUser className="h-4 w-4 text-[#3a3832]" />
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-xl p-2 text-zinc-500 transition hover:bg-[#f6efe3] hover:text-orange-600"
                title="Sign out"
              >
                <FiLogOut className="h-4 w-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
