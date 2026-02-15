"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { signInWithGoogle } from "@/app/actions";
import BrandIcon from "@/components/BrandIcon";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111113]">
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
      <div className="relative flex min-h-[calc(100vh-1rem)] items-center justify-center overflow-hidden rounded-[20px] border border-zinc-700/40 bg-[#ececec] px-4 sm:min-h-[calc(100vh-1.5rem)] sm:px-6">
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

        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-[#d6d1c6] bg-[#f8f6ef] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#d6d1c6] bg-white shadow-lg">
              <BrandIcon size={34} />
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#101115]">42Drive</h1>
            <div className="mt-2 h-[3px] w-14 bg-orange-500" />
            <p className="mt-4 text-sm text-zinc-600">Sign in to access your secure storage.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => signInWithGoogle()}
            className="group w-full rounded-2xl border border-[#cfc9bc] bg-white px-6 py-4 shadow-sm transition hover:border-orange-300"
          >
            <span className="flex items-center justify-center gap-3 text-sm font-semibold text-[#1f1f1f]">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </span>
          </motion.button>

          <p className="mt-6 text-center text-xs text-zinc-500">
            Safe, Secure, Free, Cloud Storage for All.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
