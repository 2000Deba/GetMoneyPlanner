"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }

    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong. Please try again."); return; }
      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16 relative overflow-hidden">

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/6 dark:bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">

        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}>
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to login
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>

              <div className="mb-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5 mx-auto">
                  <Mail className="w-7 h-7 text-green-500" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
                  Forgot your password?
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                  No worries. Enter your email address and we'll send you a secure link to reset your password.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@example.com"
                        autoFocus
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/60 border rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30
                          ${error ? "border-red-400 focus:border-red-400" : "border-gray-200 dark:border-slate-700 focus:border-green-500 dark:focus:border-green-500"}`}
                      />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending link…</>
                    ) : (
                      <>Send Reset Link</>
                    )}
                  </button>
                </form>
              </div>

              <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-5">
                Remember your password?{" "}
                <Link href="/login" className="text-green-500 hover:text-green-400 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>

          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center">

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Check your inbox</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-2">
                  We&apos;ve sent a password reset link to
                </p>
                <p className="text-green-500 font-semibold text-sm mb-6">{email}</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed mb-8 max-w-xs mx-auto">
                  The link expires in 1 hour. If you don't see the email, check your spam folder.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer">
                  Try a different email
                </button>
                <Link href="/login"
                  className="block w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-green-500/20 text-center">
                  Back to Login
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}