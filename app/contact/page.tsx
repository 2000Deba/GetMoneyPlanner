"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail, MessageSquare, ChevronRight, Send, Loader2, CheckCircle2, AlertCircle, X, Bug, Lightbulb, CreditCard, Shield, User, HelpCircle, Sparkles, Clock, Github, } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

type Category = "general" | "bug" | "feature" | "billing" | "privacy" | "account" | "other";

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; desc: string; accent: string }[] = [
  { value: "general", label: "General", icon: MessageSquare, desc: "General enquiry", accent: "#8b5cf6" },
  { value: "bug", label: "Bug Report", icon: Bug, desc: "Something's broken", accent: "#ef4444" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, desc: "Suggest an idea", accent: "#f59e0b" },
  { value: "billing", label: "Billing", icon: CreditCard, desc: "Payments & plans", accent: "#10b981" },
  { value: "privacy", label: "Privacy", icon: Shield, desc: "Data & privacy", accent: "#3b82f6" },
  { value: "account", label: "Account", icon: User, desc: "Login & settings", accent: "#6366f1" },
];

const inputCls = "w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 px-4 py-3 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70";

interface Toast { type: "success" | "error"; message: string; }

function ToastBar({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const s = {
    success: "bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-100",
    error: "bg-red-50 dark:bg-red-950/95 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-100",
  };
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm ${s[toast.type]}`}>
      {toast.type === "success"
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function ContactPage() {
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((type: Toast["type"], msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

  const selectedCat = CATEGORIES.find((c) => c.value === category)!;

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      show("error", "Please fill in all required fields");
      return;
    }
    if (message.trim().length < 20) {
      show("error", "Message must be at least 20 characters");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, category, message }),
      });
      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        show("error", data.error || "Something went wrong");
      }
    } catch {
      show("error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-violet-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to Contact Us
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
            Please log in to send us a message. This helps us respond to you faster and keeps your enquiry secure.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?callbackUrl=/contact"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/20">
              Log In to Continue
            </Link>
            <Link
              href="/register"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
              Create an Account
            </Link>
            <Link
              href="/"
              className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors mt-1">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[400px] bg-violet-600/4 dark:bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/3 dark:bg-indigo-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        <motion.nav variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 mb-8">
          <Link href="/" className="hover:text-violet-500 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 dark:text-slate-300 font-medium">Contact</span>
        </motion.nav>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-7 h-7 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                Get in Touch
              </h1>
              <p className="text-gray-400 dark:text-slate-400 mt-1 text-sm">
                We'd love to hear from you. Send us a message and we'll respond within 2 business days.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-1 space-y-4">

            <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
              className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-violet-500" />
                </div>
                <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">Response Time</p>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                We aim to respond to all enquiries within <strong className="text-gray-700 dark:text-slate-300">2 business days</strong>.
                Bug reports and account issues are prioritised.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
              className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">Common Topics</p>
              </div>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.value} onClick={() => setCategory(cat.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer
                        ${category === cat.value
                          ? "bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.accent }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">{cat.label}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
              className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Quick Links</p>
              <div className="space-y-1">
                <Link href="/privacy" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm text-gray-600 dark:text-slate-400 group">
                  <Shield className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors" /> Privacy Policy
                </Link>
                <Link href="/terms" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm text-gray-600 dark:text-slate-400 group">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors" /> Terms of Service
                </Link>
                <a href="https://github.com/2000Deba" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm text-gray-600 dark:text-slate-400 group">
                  <Github className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors" /> GitHub
                </a>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
            className="lg:col-span-2">

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white dark:bg-slate-900/70 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-10 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 leading-relaxed max-w-sm mx-auto">
                    Thank you for reaching out. We've sent a confirmation to <strong>{email}</strong> and will reply within 2 business days.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                    <button onClick={() => { setSent(false); setSubject(""); setMessage(""); setCategory("general"); }}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/20 cursor-pointer">
                      Send Another
                    </button>
                    <Link href="/"
                      className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                      Back to Home
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm">

                  <div className="h-1 transition-colors duration-300"
                    style={{ backgroundColor: selectedCat.accent }} />

                  <div className="p-6 lg:p-8 space-y-6">

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                        Topic <span className="text-violet-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const active = category === cat.value;
                          return (
                            <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer
                                ${active
                                  ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40"
                                  : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600"}`}>
                              <Icon className="w-4 h-4 shrink-0 transition-colors"
                                style={{ color: active ? cat.accent : undefined }}
                                color={active ? cat.accent : undefined} />
                              <span className={`text-xs font-semibold ${active ? "text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-slate-400"}`}>
                                {cat.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                          Name <span className="text-violet-500">*</span>
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                          Email <span className="text-violet-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { if (!session?.user?.email) setEmail(e.target.value); }}
                          placeholder="you@example.com"
                          readOnly={!!session?.user?.email}
                          className={`${inputCls} ${session?.user?.email
                            ? "cursor-not-allowed opacity-70 select-none"
                            : ""}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                        Subject <span className="text-violet-500">*</span>
                      </label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief description of your enquiry"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                          Message <span className="text-violet-500">*</span>
                        </label>
                        <span className={`text-xs ${message.length > 1800 ? message.length > 1950 ? "text-red-500" : "text-amber-500" : "text-gray-400 dark:text-slate-500"}`}>
                          {message.length}/2000
                        </span>
                      </div>
                      <textarea
                        value={message}
                        onChange={(e) => { if (e.target.value.length <= 2000) setMessage(e.target.value); }}
                        placeholder="Describe your question or issue in detail. The more context you provide, the faster we can help."
                        rows={6}
                        className={`${inputCls} resize-none`}
                      />
                      {message.trim().length > 0 && message.trim().length < 20 && (
                        <p className="text-xs text-amber-500">Please write at least 20 characters</p>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5 bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-gray-200 dark:border-slate-700/50">
                      <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                        Your message is stored securely. We'll only use your email to respond to this enquiry.
                        See our <Link href="/privacy" className="text-violet-500 hover:underline">Privacy Policy</Link> for details.
                      </p>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={sending || !name.trim() || !email.trim() || !subject.trim() || message.trim().length < 20}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-violet-900/20 active:scale-[0.98]">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sending ? "Sending…" : "Send Message"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}