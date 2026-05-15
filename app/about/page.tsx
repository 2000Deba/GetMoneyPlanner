"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Target, Shield, Zap, Heart, TrendingUp, Users, Building2, Star, CheckCircle2, Lightbulb, Globe, Lock, BarChart3, RefreshCw, FileSpreadsheet, Sparkles, } from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

const fadeLeft = {
    hidden: { opacity: 0, x: -32 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

const fadeRight = {
    hidden: { opacity: 0, x: 32 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
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

function ValueCard({ icon: Icon, title, desc, color, index }: {
    icon: React.ElementType; title: string; desc: string; color: string; index: number;
}) {
    return (
        <motion.div variants={fadeUp} custom={index}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}12 0%, transparent 60%)` }} />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                style={{ backgroundColor: color }} />
        </motion.div>
    );
}

function TimelineItem({ year, title, desc, index, isLast }: {
    year: string; title: string; desc: string; index: number; isLast?: boolean;
}) {
    return (
        <motion.div variants={fadeLeft} custom={index} className="flex gap-6">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                    {year.slice(2)}
                </div>
                {!isLast && <div className="w-px flex-1 mt-2 bg-gradient-to-b from-green-500/30 to-transparent min-h-[32px]" />}
            </div>
            <div className="pb-8">
                <span className="text-xs font-bold text-green-500 uppercase tracking-widest">{year}</span>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mt-0.5 mb-1">{title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    );
}

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
    return (
        <div className="flex flex-col items-center px-6 py-4 rounded-2xl border"
            style={{ backgroundColor: `${color}08`, borderColor: `${color}20` }}>
            <span className="text-2xl font-black" style={{ color }}>{value}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400 mt-1 text-center font-medium">{label}</span>
        </div>
    );
}

export default function AboutPage() {
    const values = [
        { icon: Target, title: "Clarity First", color: "#8b5cf6", desc: "We believe financial clarity is a right, not a privilege. Every feature is designed to make complex data simple and actionable." },
        { icon: Shield, title: "Security by Design", color: "#6366f1", desc: "2FA, session management, encrypted data — security isn't an afterthought. It's built into every layer of GetMoneyPlanner." },
        { icon: Zap, title: "Speed & Reliability", color: "#06b6d4", desc: "Fast API responses, real-time sync, and zero downtime. Your financial data is always available when you need it." },
        { icon: Heart, title: "User Obsessed", color: "#ec4899", desc: "Every pixel, every interaction is designed with the user in mind. We build what you actually need, not what looks impressive." },
        { icon: Globe, title: "Built for Everyone", color: "#10b981", desc: "From solo freelancers to enterprise teams, from students to family households — GetMoneyPlanner scales to your needs." },
        { icon: Lightbulb, title: "Continuous Innovation", color: "#f59e0b", desc: "We ship constantly. Auto-sync, PDF exports, animated goals — we're always adding features that genuinely save you time." },
    ];

    const timeline = [
        { year: "2024", title: "The Idea", desc: "Frustrated by complex, expensive financial tools, we started building a simpler alternative that works for everyone — from individuals to businesses." },
        { year: "2025", title: "Core Features", desc: "Launched transaction management, dashboard analytics, and the first version of goal tracking. 2FA and session security added early." },
        { year: "2026", title: "Full Platform", desc: "PDF & Excel exports, auto-sync with categories, profile setup, monthly budget insights, and mobile optimization — GetMoneyPlanner becomes production-ready." },
    ];

    const team = [
        { name: "Full-Stack Development", role: "Next.js · TypeScript · MongoDB · React Native", icon: "💻", color: "#8b5cf6" },
        { name: "UI/UX Design", role: "Tailwind CSS · Framer Motion · Mobile-first", icon: "🎨", color: "#06b6d4" },
        { name: "Security & Auth", role: "NextAuth · 2FA · Session Tracking · bcrypt", icon: "🔒", color: "#10b981" },
        { name: "Data & Export", role: "jsPDF · ExcelJS · Recharts · MongoDB Atlas", icon: "📊", color: "#f59e0b" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-x-hidden">

            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/7 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/6 rounded-full blur-3xl" />
                <div className="absolute top-2/3 left-0 w-72 h-72 bg-cyan-500/4 dark:bg-cyan-500/5 rounded-full blur-3xl" />
            </div>

            <section className="relative z-10 pt-28 pb-20 px-4 text-center">
                <motion.div
                    initial="hidden" animate="visible"
                    className="max-w-4xl mx-auto">

                    <motion.div variants={fadeUp} custom={0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-8">
                        <Sparkles className="w-4 h-4" />
                        Our Story
                    </motion.div>

                    <motion.h1 variants={fadeUp} custom={1}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.08]">
                        <span className="text-gray-900 dark:text-white">Built by someone who</span>
                        <br />
                        <span className="bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                            needed it too
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} custom={2}
                        className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        GetMoneyPlanner was born from a simple frustration — existing financial tools were
                        either too complex, too expensive, or too basic. We wanted something that works
                        for real people with real financial goals.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={3}
                        className="flex flex-wrap items-center justify-center gap-3 mb-12">
                        <StatPill value="2026" label="Founded" color="#22c55e" />
                        <StatPill value="100%" label="Self-funded" color="#8b5cf6" />
                        <StatPill value="5+" label="Core Features" color="#06b6d4" />
                        <StatPill value="∞" label="Passion" color="#f59e0b" />
                    </motion.div>

                    <motion.div variants={fadeUp} custom={4}
                        className="relative max-w-2xl mx-auto bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-left overflow-hidden">
                        <div className="absolute -top-2 left-6 text-5xl text-green-500/30 font-black leading-none select-none">"</div>
                        <p className="text-gray-700 dark:text-slate-300 text-base leading-relaxed italic pl-4">
                            Financial management shouldn't require an accounting degree. Everyone deserves
                            a tool that's powerful enough for businesses and simple enough for students.
                        </p>
                        <div className="mt-4 flex items-center gap-3 pl-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                GMP
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">GetMoneyPlanner Team</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500">Founders</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            <Section className="relative z-10 py-20 px-4 bg-white/40 dark:bg-slate-900/40">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">

                        {/* Left */}
                        <motion.div variants={fadeLeft}>
                            <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Our Mission</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                                Democratize financial clarity for every type of user
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
                                Whether you're a business owner tracking departmental expenses, a student managing
                                your first salary, or a family planning for the future — GetMoneyPlanner gives you
                                the same powerful tools that used to be reserved for enterprise software.
                            </p>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                                We believe in transparency, simplicity, and building software that actually solves
                                problems. No bloat, no unnecessary complexity — just clean, fast, and reliable
                                financial management.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Free to start, no hidden fees",
                                    "Works for individuals and teams",
                                    "Your data is always yours — exportable anytime",
                                    "Built with production-grade security from day one",
                                ].map((item, i) => (
                                    <motion.div key={i} variants={fadeLeft} custom={i}
                                        className="flex items-center gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-slate-300">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={fadeRight} className="relative">
                            <div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-3xl" />
                            <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Who we serve</p>
                                {[
                                    { icon: Building2, label: "Businesses & Organisations", desc: "Track departmental budgets, export reports for stakeholders", color: "#8b5cf6" },
                                    { icon: Users, label: "Individuals & Freelancers", desc: "Personal budgets, savings goals, income tracking", color: "#06b6d4" },
                                    { icon: Star, label: "Students & Young Pros", desc: "First salary management, smart money habits", color: "#10b981" },
                                    { icon: Heart, label: "Families", desc: "Shared goals, household budgeting, spending visibility", color: "#f59e0b" },
                                ].map((item, i) => (
                                    <motion.div key={i} variants={fadeRight} custom={i}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div variants={fadeUp} className="text-center mb-14">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-500 mb-3">What we stand for</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                            Our Core Values
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
                            These aren't just words on a page — they're the principles behind every feature we build and every decision we make.
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {values.map((v, i) => <ValueCard key={i} {...v} index={i} />)}
                    </div>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4 bg-white/40 dark:bg-slate-900/40">
                <div className="max-w-4xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-14 items-start">

                        <motion.div variants={fadeLeft}>
                            <span className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-500 mb-3">Our Journey</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                                From frustration to production
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
                                GetMoneyPlanner didn't start in a boardroom. It started with a developer looking
                                at spreadsheets and thinking: there has to be a better way.
                            </p>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                                What began as a personal project grew into a full-featured platform — with
                                transaction management, analytics, goal tracking, and exports that rival
                                tools costing hundreds of dollars per month.
                            </p>
                        </motion.div>

                        <div>
                            {timeline.map((t, i) => (
                                <TimelineItem key={i} {...t} index={i} isLast={i === timeline.length - 1} />
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div variants={fadeUp} className="text-center mb-14">
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Built with care</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                            Production-Grade Technology
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
                            GetMoneyPlanner is built on modern, battle-tested technology that scales from a single
                            user to an enterprise team.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                        {team.map((item, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i}
                                className="flex items-start gap-4 p-5 bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-2xl">
                                <div className="text-3xl shrink-0">{item.icon}</div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 leading-relaxed">{item.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={fadeUp} custom={4}
                        className="flex flex-wrap justify-center gap-2">
                        {["Next.js 15", "TypeScript", "MongoDB", "NextAuth.js", "Framer Motion",
                            "Tailwind CSS", "Recharts", "jsPDF", "ExcelJS", "bcryptjs", "speakeasy", "React Native"].map((tech, i) => (
                                <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-xs font-medium rounded-full">
                                    {tech}
                                </span>
                            ))}
                    </motion.div>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4 bg-white/40 dark:bg-slate-900/40">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div variants={fadeUp}>
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Looking ahead</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6">
                            Where we're headed
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-3 gap-5 mb-12">
                        {[
                            { icon: TrendingUp, title: "AI-powered Insights", desc: "Smart budget recommendations and spending pattern analysis powered by machine learning.", color: "#8b5cf6" },
                            { icon: Globe, title: "Multi-currency & Teams", desc: "Full multi-currency support and collaborative team workspaces for organizations.", color: "#06b6d4" },
                            { icon: RefreshCw, title: "Bank Integration", desc: "Direct bank account linking for automatic, real-time transaction import.", color: "#10b981" },
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i}
                                className="p-5 bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                    style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.title}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.p variants={fadeUp} custom={3}
                        className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        We&apos;re committed to keeping GetMoneyPlanner accessible, powerful, and constantly improving.
                        The best version of this product is still being built — and your feedback shapes it.
                    </motion.p>
                </div>
            </Section>

            <Section className="relative z-10 py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <motion.div variants={fadeUp}
                        className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-10 sm:p-14 text-center shadow-2xl shadow-green-500/25">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                        </div>
                        <div className="relative z-10">
                            <Heart className="w-10 h-10 text-white/80 mx-auto mb-4" />
                            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                                Be part of the journey
                            </h2>
                            <p className="text-green-100 mb-8 text-lg max-w-xl mx-auto">
                                Join users who've taken control of their finances with GetMoneyPlanner.
                                Free to start, built to last.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/register"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-2xl hover:bg-green-50 transition-all shadow-lg hover:scale-105">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/features"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-all">
                                    View Features
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Section>

        </div>
    );
}