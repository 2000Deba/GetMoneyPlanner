"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, BarChart3, Target, RefreshCw, TrendingUp, Shield, Zap, Check, FileSpreadsheet, FileText, Search, Bell, Lock, Smartphone, ChevronDown, Sparkles, Settings, CheckCircle2, X, Database, Eye, } from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

const fadeLeft = {
    hidden: { opacity: 0, x: -28 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

const fadeRight = {
    hidden: { opacity: 0, x: 28 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.section ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
            {children}
        </motion.section>
    );
}

function FeatureBlock({ title, subtitle, desc, bullets, mockup, color, reverse, index }: {
    title: string; subtitle: string; desc: string;
    bullets: string[]; mockup: React.ReactNode;
    color: string; reverse?: boolean; index: number;
}) {
    return (
        <Section className="relative z-10 py-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className={`grid lg:grid-cols-2 gap-14 items-center ${reverse ? "lg:grid-flow-dense" : ""}`}>

                    <motion.div variants={reverse ? fadeRight : fadeLeft} className={reverse ? "lg:col-start-2" : ""}>
                        <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>
                            {subtitle}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                            {title}
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-7">{desc}</p>
                        <div className="space-y-2.5">
                            {bullets.map((b, i) => (
                                <motion.div key={i} variants={reverse ? fadeRight : fadeLeft} custom={i}
                                    className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                                        <Check className="w-3 h-3" style={{ color }} />
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-slate-300">{b}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={reverse ? fadeLeft : fadeRight}
                        className={`relative ${reverse ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                        <div className="absolute inset-0 blur-3xl rounded-3xl opacity-60"
                            style={{ backgroundColor: `${color}12` }} />
                        <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                            {mockup}
                        </div>
                    </motion.div>
                </div>
            </div>
        </Section>
    );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div variants={fadeUp} custom={index}
            className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/80">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{q}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden">
                        <p className="px-5 pb-4 text-sm text-gray-500 dark:text-slate-400 leading-relaxed border-t border-gray-100 dark:border-slate-800 pt-3">
                            {a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CompRow({ feature, us, them }: { feature: string; us: boolean | string; them: boolean | string }) {
    const renderVal = (val: boolean | string) => {
        if (val === true) return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />;
        if (val === false) return <X className="w-5 h-5 text-red-400 mx-auto" />;
        return <span className="text-xs text-gray-600 dark:text-slate-400 text-center block">{val}</span>;
    };
    return (
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
            <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">{feature}</span>
            <div className="flex items-center justify-center">{renderVal(us)}</div>
            <div className="flex items-center justify-center">{renderVal(them)}</div>
        </div>
    );
}

export default function FeaturesPage() {
    const { status } = useSession();
    const router = useRouter();

    const isAuthenticated = status === "authenticated";

    const handleGetStarted = () => {
        if (isAuthenticated) {
            router.push("/dashboard");
        } else {
            router.push("/register");
        }
    };

    const allFeatures = [
        { icon: BarChart3, title: "Dashboard Analytics", color: "#8b5cf6", desc: "Real-time charts and visualizations" },
        { icon: TrendingUp, title: "Transaction Management", color: "#22c55e", desc: "Full CRUD with filters and search" },
        { icon: Target, title: "Goal Tracking", color: "#10b981", desc: "Savings, debt, investment milestones" },
        { icon: RefreshCw, title: "Auto Sync", color: "#06b6d4", desc: "Category-linked automatic updates" },
        { icon: FileText, title: "PDF Export", color: "#ef4444", desc: "Professional formatted reports" },
        { icon: FileSpreadsheet, title: "Excel Export", color: "#10b981", desc: "Proper numeric formatting" },
        { icon: Shield, title: "2FA Security", color: "#6366f1", desc: "TOTP authenticator support" },
        { icon: Eye, title: "Session Management", color: "#f59e0b", desc: "Track and revoke active sessions" },
        { icon: Settings, title: "Profile & Preferences", color: "#8b5cf6", desc: "Currency, budget, notifications" },
        { icon: Bell, title: "Smart Notifications", color: "#06b6d4", desc: "Email alerts for key events" },
        { icon: Smartphone, title: "Mobile Optimized", color: "#ec4899", desc: "Perfect on any screen size" },
        { icon: Database, title: "Data Export", color: "#f59e0b", desc: "Full account data download" },
    ];

    const faqs = [
        { q: "Is GetMoneyPlanner free to use?", a: "Yes — GetMoneyPlanner is free to start. Create an account, set up your profile, and start tracking transactions and goals immediately with no credit card required." },
        { q: "How does Auto Sync work?", a: "When you create a goal with Auto Sync enabled, you link it to a transaction category (e.g. 'Salary' or 'Savings'). Every time a matching transaction is added, it automatically counts toward that goal — no manual entry needed." },
        { q: "Can I export my data?", a: "Absolutely. You can export your transaction data as a professionally formatted PDF or Excel (.xlsx) file at any time. The export includes charts, summaries, and a breakdown by category." },
        { q: "How secure is my data?", a: "Very secure. We use bcrypt password hashing, optional TOTP two-factor authentication, active session tracking with device/location info, and JWT-based authentication. You can revoke any session remotely from your profile." },
        { q: "Does it work for businesses?", a: "Yes — GetMoneyPlanner is designed with businesses as the primary audience. You can track departmental expenses, generate professional reports for stakeholders, and export data for accounting purposes." },
        { q: "Is there a mobile app?", a: "GetMoneyPlanner is fully mobile-optimized as a web app. A dedicated React Native mobile app is on our roadmap and in active development." },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-x-hidden">

            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-500/5 dark:bg-violet-500/7 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-green-500/5 dark:bg-green-500/6 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/4 rounded-full blur-3xl" />
            </div>

            <section className="relative z-10 pt-28 pb-20 px-4 text-center">
                <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto">

                    <motion.div variants={fadeUp} custom={0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-semibold mb-8">
                        <Sparkles className="w-4 h-4" />
                        Everything you need
                    </motion.div>

                    <motion.h1 variants={fadeUp} custom={1}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.08]">
                        <span className="text-gray-900 dark:text-white">Powerful features.</span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500 bg-clip-text text-transparent">
                            Zero complexity.
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} custom={2}
                        className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Every feature in GetMoneyPlanner is designed to save you time, give you clarity,
                        and help you make smarter financial decisions — without needing an accountant.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={3}
                        className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            disabled={status === "loading"}
                            onClick={handleGetStarted}
                            className={`group inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl transition-all shadow-xl shadow-green-500/25 hover:scale-105 text-base ${status === "loading" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                            {status === "loading" ? "Loading..." : "Start for Free"}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link href="/about"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-base">
                            Our Story
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            <Section className="relative z-10 py-16 px-4 border-y border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <div className="max-w-5xl mx-auto">
                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            12 features. One platform.
                        </h2>
                    </motion.div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {allFeatures.map((f, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i}
                                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                className="group flex flex-col items-center text-center gap-2.5 p-4 bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-2xl cursor-default">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-xs">{f.title}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 leading-tight">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            <FeatureBlock
                subtitle="Dashboard Analytics"
                title="Your finances at a glance — beautifully visualized"
                desc="The dashboard gives you an instant overview of your financial health. Income vs expenses, net savings, goal progress, and monthly trends — all in one screen, updated in real-time."
                color="#8b5cf6"
                bullets={[
                    "Interactive bar, donut, and line charts powered by Recharts",
                    "Monthly income vs expense comparison with trend indicators",
                    "Yearly report table with category-by-category breakdown",
                    "Goal progress rings with animated completion indicators",
                    "One-click PDF export of your entire dashboard report",
                ]}
                mockup={
                    <div className="p-5 bg-gray-50 dark:bg-slate-950 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { l: "Income", v: "₹1,20,000", c: "#22c55e" },
                                { l: "Expenses", v: "₹68,500", c: "#ef4444" },
                                { l: "Savings", v: "₹51,500", c: "#8b5cf6" },
                                { l: "Goals", v: "3 Active", c: "#f59e0b" },
                            ].map((c, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 dark:text-slate-500">{c.l}</p>
                                    <p className="font-bold text-sm mt-0.5" style={{ color: c.c }}>{c.v}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-2">Monthly Overview</p>
                            <div className="flex items-end gap-1 h-14">
                                {[40, 65, 30, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
                                    <motion.div key={i} className="flex-1 rounded-t-sm"
                                        style={{ backgroundColor: i % 2 === 0 ? "#8b5cf6" : "#22c55e", opacity: 0.7 }}
                                        initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.3 + i * 0.04, duration: 0.4 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                }
                index={0}
            />

            <FeatureBlock
                subtitle="Transaction Management"
                title="Log, categorize, and analyze every transaction"
                desc="A full-featured transaction manager with search, filters, bulk actions, and exports. Whether you're logging daily expenses or reviewing monthly spending, everything is fast and intuitive."
                color="#22c55e"
                reverse
                bullets={[
                    "Add income and expense transactions with categories and notes",
                    "Search and filter by date range, type, category, or keyword",
                    "Bulk select and delete multiple transactions at once",
                    "Export filtered results as PDF or Excel with one click",
                    "Note preview modal for long transaction descriptions",
                ]}
                mockup={
                    <div className="p-4 bg-gray-50 dark:bg-slate-950 space-y-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2">
                            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-400">Search transactions…</span>
                        </div>
                        {[
                            { label: "Salary", cat: "Income", amount: "+₹80,000", color: "#22c55e", date: "Apr 1" },
                            { label: "Rent", cat: "Utilities", amount: "-₹15,000", color: "#ef4444", date: "Apr 3" },
                            { label: "Freelance", cat: "Income", amount: "+₹25,000", color: "#22c55e", date: "Apr 7" },
                            { label: "Groceries", cat: "Food", amount: "-₹4,200", color: "#f59e0b", date: "Apr 9" },
                            { label: "Investment", cat: "Investment", amount: "-₹20,000", color: "#8b5cf6", date: "Apr 12" },
                        ].map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.07 }}
                                className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{t.label}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">{t.cat} · {t.date}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold" style={{ color: t.color }}>{t.amount}</span>
                            </motion.div>
                        ))}
                    </div>
                }
                index={1}
            />

            <FeatureBlock
                subtitle="Goal Tracking"
                title="Set milestones. Watch them come to life."
                desc="Create savings goals, debt payoff targets, and investment milestones. Track progress with animated rings, get smart projections based on your monthly budget, and auto-sync progress from transaction categories."
                color="#10b981"
                bullets={[
                    "4 goal types: Savings, Debt Payoff, Investment, Custom",
                    "Manual contributions or automatic sync from transaction categories",
                    "Animated progress rings with percentage tracking",
                    "Budget insight card with months-to-completion projection",
                    "Pause, resume, and complete goals with status management",
                ]}
                mockup={
                    <div className="p-4 bg-gray-50 dark:bg-slate-950 space-y-3">
                        {[
                            { title: "Emergency Fund", pct: 64, current: "₹3,20,000", target: "₹5,00,000", color: "#10b981" },
                            { title: "New Laptop", pct: 38, current: "₹19,000", target: "₹50,000", color: "#8b5cf6" },
                            { title: "Car Loan Payoff", pct: 82, current: "₹1,64,000", target: "₹2,00,000", color: "#06b6d4" },
                        ].map((g, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{g.title}</p>
                                    <span className="text-xs font-bold" style={{ color: g.color }}>{g.pct}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div className="h-full rounded-full"
                                        style={{ backgroundColor: g.color }}
                                        initial={{ width: 0 }} animate={{ width: `${g.pct}%` }}
                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }} />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-xs text-gray-400">{g.current}</span>
                                    <span className="text-xs text-gray-400">of {g.target}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                }
                index={2}
            />

            <FeatureBlock
                subtitle="PDF & Excel Export"
                title="Professional reports, one click away"
                desc="Generate boardroom-ready reports instantly. Export your transaction history as a beautifully formatted PDF or a fully structured Excel file — perfect for business reviews, tax filing, or personal records."
                color="#f59e0b"
                reverse
                bullets={[
                    "PDF reports with branded headers, summary cards, and charts",
                    "Excel exports with proper currency formatting and number types",
                    "Filter by date range before exporting — export exactly what you need",
                    "Page-numbered PDF with transaction tables and category breakdown",
                    "One-click download — no waiting, no email required",
                ]}
                mockup={
                    <div className="p-5 bg-gray-50 dark:bg-slate-950 space-y-3">
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Financial Report</p>
                                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">April 2026</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { l: "Total Income", v: "₹1,20,000", c: "#22c55e" },
                                    { l: "Total Expense", v: "₹68,500", c: "#ef4444" },
                                    { l: "Net Savings", v: "₹51,500", c: "#8b5cf6" },
                                    { l: "Goals Met", v: "2 / 3", c: "#f59e0b" },
                                ].map((r, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-2">
                                        <p className="text-xs text-gray-400">{r.l}</p>
                                        <p className="font-bold text-xs mt-0.5" style={{ color: r.c }}>{r.v}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <motion.div whileHover={{ scale: 1.02 }}
                                    className="flex-1 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2 cursor-pointer">
                                    <FileText className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">Export PDF</span>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }}
                                    className="flex-1 flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-3 py-2 cursor-pointer">
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">Export Excel</span>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                }
                index={3}
            />

            <FeatureBlock
                subtitle="Security & Privacy"
                title="Bank-level security you can see and control"
                desc="Security isn't just a checkbox at GetMoneyPlanner — it's a core feature. See every active session, revoke any device remotely, and enable 2FA to protect your account with a hardware authenticator."
                color="#6366f1"
                bullets={[
                    "TOTP-based two-factor authentication (Google Authenticator, Authy)",
                    "Active session tracking with device name, location, and timestamp",
                    "Revoke any session remotely — even if you're still logged in",
                    "Sliding 7-day session expiry — active use keeps you logged in",
                    "bcrypt password hashing with salt rounds",
                ]}
                mockup={
                    <div className="p-4 bg-gray-50 dark:bg-slate-950 space-y-3">
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Active Sessions</p>
                            {[
                                { device: "Chrome on Windows", loc: "West Bengal, India", active: true },
                                { device: "Android Device", loc: "West Bengal, India", active: true },
                                { device: "Safari on macOS", loc: "Mumbai, India", active: false },
                            ].map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className={`flex items-center justify-between py-2 ${i < 2 ? "border-b border-gray-100 dark:border-slate-800" : ""}`}>
                                    <div>
                                        <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{s.device}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">{s.loc}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-800 text-gray-400"}`}>
                                        {s.active ? "● Active" : "Expired"}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3 flex items-center gap-3">
                            <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">2FA Enabled</p>
                                <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70">Authenticator app active</p>
                            </div>
                        </div>
                    </div>
                }
                index={4}
            />

            <Section className="relative z-10 py-20 px-4 bg-white/40 dark:bg-slate-900/40">
                <div className="max-w-3xl mx-auto">
                    <motion.div variants={fadeUp} className="text-center mb-12">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-500 mb-3">Why GetMoneyPlanner</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                            How we compare
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
                            See how GetMoneyPlanner stacks up against typical generic finance apps.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeUp} custom={1}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        {/* Header */}
                        <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Feature</span>
                            <span className="text-xs font-bold text-center text-green-600 dark:text-green-400 uppercase tracking-widest leading-tight">
                                <span className="hidden sm:inline">GetMoneyPlanner</span>
                                <span className="sm:hidden">GMP</span>
                            </span>
                            <span className="text-xs font-bold text-center text-gray-400 uppercase tracking-widest leading-tight">
                                <span className="hidden sm:inline">Generic Apps</span>
                                <span className="sm:hidden">Others</span>
                            </span>
                        </div>
                        <div className="px-5 divide-y divide-gray-100 dark:divide-slate-800">
                            <CompRow feature="Transaction Management" us={true} them={true} />
                            <CompRow feature="PDF Export" us={true} them="Paid only" />
                            <CompRow feature="Excel Export" us={true} them={false} />
                            <CompRow feature="Goal Tracking" us={true} them="Basic" />
                            <CompRow feature="Auto Sync (categories)" us={true} them={false} />
                            <CompRow feature="2FA Security" us={true} them="Paid only" />
                            <CompRow feature="Session Management" us={true} them={false} />
                            <CompRow feature="Dashboard Analytics" us={true} them="Limited" />
                            <CompRow feature="Mobile Optimized" us={true} them="Partial" />
                            <CompRow feature="Free to Use" us={true} them="Freemium" />
                        </div>
                    </motion.div>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4">
                <div className="max-w-2xl mx-auto">
                    <motion.div variants={fadeUp} className="text-center mb-12">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Got questions?</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                            Frequently Asked
                        </h2>
                    </motion.div>
                    <div className="space-y-3">
                        {faqs.map((f, i) => <FAQItem key={i} {...f} index={i} />)}
                    </div>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <motion.div variants={fadeUp}
                        className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-10 sm:p-14 text-center shadow-2xl shadow-violet-500/25">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                        </div>
                        <div className="relative z-10">
                            <Zap className="w-10 h-10 text-white/80 mx-auto mb-4" />
                            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                                Ready to take control?
                            </h2>
                            <p className="text-violet-100 mb-8 text-lg max-w-xl mx-auto">
                                All these features, completely free to start. No credit card. No commitments.
                                Just better financial management starting today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/register"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-all shadow-lg hover:scale-105">
                                    Create Free Account
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/about"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-all">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Section>

        </div>
    );
}