"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import BrandIcon from "@/components/BrandIcon";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f10]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          className="grid h-12 w-12 place-items-center rounded-xl border border-[#d6d1c6] bg-[#f8f6ef]"
        >
          <BrandIcon size={24} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111113] p-2 sm:p-3">
      <div className="relative flex min-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-[20px] border border-zinc-700/40 bg-[#ececec] shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:min-h-[calc(100vh-1.5rem)]">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(24,24,27,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.07) 1px, transparent 1px)",
              backgroundSize: "110px 110px",
            }}
          />
        </div>

        <header className="relative z-10 flex items-start justify-between gap-4 px-4 pb-2 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-2">
            <BrandIcon size={22} />
            <div>
              <p className="text-[12px] font-semibold tracking-tight text-zinc-700">42 Drive</p>
              <div className="mt-1 h-[2px] w-14 bg-zinc-700/40" />
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <nav className="flex items-center gap-3 text-[13px] font-semibold text-zinc-700 sm:gap-6 sm:text-[15px]">
              <button
                type="button"
                className="transition hover:text-zinc-900"
                onClick={() => setShowAbout((prev) => !prev)}
              >
                About
              </button>
              <span className="cursor-default">Safe</span>
              <span className="cursor-default">Cloud storage</span>
              <button
                type="button"
                className="relative transition hover:text-zinc-900"
                onClick={() => setShowContact(true)}
              >
                Get in touch
                <span className="absolute -right-2 -top-2 h-1.5 w-6 rotate-[-28deg] bg-orange-500" />
              </button>
            </nav>

            <Link
              href="/login"
              className="rounded-lg border border-zinc-900 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.09em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
            >
              Enter
            </Link>
          </div>
        </header>

        <AnimatePresence>
          {showAbout && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative z-10 mx-4 mt-1 rounded-xl border border-zinc-300 bg-white/75 px-4 py-3 backdrop-blur sm:mx-6"
            >
              <p className="text-sm font-medium text-zinc-700 sm:text-base">
                Our motto: Safe, Secure, Free, Cloud Storage for All.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 flex flex-1 items-center px-2 pb-6 pt-2 sm:px-4 sm:pb-8 md:px-6 md:pb-10 lg:items-end lg:pt-0">
          <div className="w-full">
            <h1 className="select-none text-center font-black leading-[0.86] tracking-[-0.06em] text-[#101115] sm:text-left lg:whitespace-nowrap lg:text-[19vw] xl:text-[17.5vw]">
              <span className="block text-[38vw] sm:text-[32vw] md:text-[28vw] lg:inline lg:text-inherit">
                42
              </span>
              <span className="block text-[32vw] sm:text-[28vw] md:text-[24vw] lg:ml-0 lg:inline lg:text-inherit">
                Dr
                <span className="relative ml-[0.025em] inline-block">
                  i
                  <span className="absolute left-[0.02em] right-[0.02em] top-[-0.16em] h-[0.07em] bg-orange-500" />
                </span>
                ve
              </span>
            </h1>
          </div>
        </main>

        <AnimatePresence>
          {showContact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 grid place-items-center bg-black/35 px-4"
              onClick={() => setShowContact(false)}
            >
              <motion.div
                initial={{ y: 18, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-md rounded-[2px] border border-[#ddd7cb] bg-[#f8f6ef] p-7 text-[#22211f] shadow-[0_30px_70px_rgba(0,0,0,0.32)]"
              >
                <div className="rounded-[1px] border border-[#ece7dc] bg-[#fbfaf5] px-5 py-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#8e8576]">
                    42 Drive
                  </p>
                  <h2 className="mt-2 font-serif text-[28px] font-semibold leading-tight tracking-[0.07em] text-[#2a2824]">
                    PROMIT BHATTACHERJEE
                  </h2>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[#8a8071]">
                    Cloud Infrastructure
                  </p>

                  <div className="my-4 border-t border-dashed border-[#cfc5b3]" />

                  <div className="space-y-1.5 text-[13px] tracking-[0.04em] text-[#47423a]">
                    <p>promit.xi@gmail.com</p>
                    <p>+91-9742757917</p>
                    <a
                      href="https://x.com/PromitXi"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block border-b border-[#6f675a] leading-tight hover:text-black"
                    >
                      x.com/PromitXi
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowContact(false)}
                  className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#7e7568] transition hover:text-black"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
