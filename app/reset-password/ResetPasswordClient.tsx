"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, ArrowLeft, ShieldCheck, X, Check, } from "lucide-react";

function getStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
    if (score <= 3) return { score, label: "Good", color: "#06b6d4" };
    return { score, label: "Strong", color: "#22c55e" };
}

const rules = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    const strength = getStrength(password);

    useEffect(() => {
        if (!token) { setTokenValid(false); return; }
        fetch(`/api/auth/reset-password/verify?token=${token}`)
            .then(r => r.json())
            .then(d => setTokenValid(d.valid === true))
            .catch(() => setTokenValid(false));
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
        if (strength.score < 2) { setError("Please choose a stronger password"); return; }
        if (password !== confirm) { setError("Passwords do not match"); return; }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Something went wrong. Please try again."); return; }
            setDone(true);
            setTimeout(() => router.push("/login"), 3500);
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    if (tokenValid === null) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-400 dark:text-slate-500">Verifying your link…</p>
                </motion.div>
            </div>
        );
    }

    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md text-center">

                    <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Link expired or invalid</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                        This password reset link has expired or already been used. Reset links are valid for 1 hour.
                    </p>
                    <div className="space-y-3">
                        <Link href="/forgot-password"
                            className="block w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-green-500/20 text-center">
                            Request a new link
                        </Link>
                        <Link href="/login"
                            className="block w-full py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm text-center">
                            Back to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16 relative overflow-hidden">

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/6 dark:bg-green-500/8 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">

                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                    <Link href="/login"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to login
                    </Link>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!done ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}>

                            {/* Header */}
                            <div className="mb-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5 mx-auto">
                                    <ShieldCheck className="w-7 h-7 text-green-500" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
                                    Set a new password
                                </h1>
                                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Choose a strong password. You'll use this to sign into your GetMoneyPlanner account.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                                <form onSubmit={handleSubmit} className="space-y-5">

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            <input
                                                type={showPw ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                                placeholder="Create a strong password"
                                                className="w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                            />
                                            <button type="button" onClick={() => setShowPw(!showPw)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {password.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                                className="space-y-2 mt-2">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((i) => (
                                                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                                                            style={{ backgroundColor: i <= strength.score ? strength.color : "#e5e7eb" }} />
                                                    ))}
                                                </div>
                                                <p className="text-xs font-medium" style={{ color: strength.color }}>
                                                    {strength.label} password
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                value={confirm}
                                                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                                                placeholder="Repeat your password"
                                                className={`w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-slate-800/60 border rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${confirm.length > 0 && password !== confirm
                                                    ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                                                    : confirm.length > 0 && password === confirm
                                                        ? "border-green-400 focus:border-green-500 focus:ring-green-500/20"
                                                        : "border-gray-200 dark:border-slate-700 focus:border-green-500 focus:ring-green-500/20"}`}
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {password.length > 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="grid grid-cols-2 gap-1.5 p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800">
                                            {rules.map((rule, i) => {
                                                const ok = rule.test(password);
                                                return (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        {ok
                                                            ? <Check className="w-3 h-3 text-green-500 shrink-0" />
                                                            : <X className="w-3 h-3 text-gray-300 dark:text-slate-600 shrink-0" />}
                                                        <span className={`text-xs ${ok ? "text-gray-700 dark:text-slate-300" : "text-gray-400 dark:text-slate-500"}`}>
                                                            {rule.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </motion.div>
                                    )}

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="submit"
                                        disabled={loading || password !== confirm || password.length < 8}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Resetting password…</>
                                        ) : (
                                            <>Reset Password</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>

                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                            className="text-center">

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Password reset!</h2>
                                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-2">
                                    Your password has been updated successfully.
                                </p>
                                <p className="text-gray-400 dark:text-slate-500 text-xs mb-8">
                                    Redirecting you to login in a moment…
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                <Link href="/login"
                                    className="block w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-green-500/20 text-center">
                                    Go to Login
                                </Link>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}