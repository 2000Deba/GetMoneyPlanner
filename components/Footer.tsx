// components/Footer.tsx

"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Target, RefreshCw, FileSpreadsheet, Shield, TrendingUp, Heart, Github, Twitter, Mail, ArrowUpRight, Instagram, Linkedin, Facebook, Check } from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

const footerLinks = {
    Product: [
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Dashboard", href: "/dashboard" },
        { name: "Transactions", href: "/transactions" },
        { name: "Goals", href: "/goals" },
    ],
    Company: [
        { name: "About Us", href: "/about" },
        { name: "Features", href: "/features" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Contact Us", href: "/contact" },
    ],
    Account: [
        { name: "Sign Up", href: "/register" },
        { name: "Log In", href: "/login" },
        { name: "Forgot Password", href: "/forgot-password" },
        { name: "Profile", href: "/profile" },
    ],
};

const features = [
    { icon: BarChart3, label: "Dashboard Analytics" },
    { icon: TrendingUp, label: "Transaction Tracking" },
    { icon: Target, label: "Goal Management" },
    { icon: RefreshCw, label: "Auto Sync" },
    { icon: FileSpreadsheet, label: "PDF & Excel Export" },
    { icon: Shield, label: "2FA Security" },
    { icon: Check, label: "Free to Start" },
];

const socials = [
    { icon: Mail, href: "mailto:deep2000seal@gmail.com", label: "Email" },
    { icon: Github, href: "https://github.com/2000Deba", label: "GitHub" },
    { icon: Linkedin, href: "https://in.linkedin.com/in/debasishseal", label: "LinkedIn" },
    { icon: Twitter, href: "https://x.com/shildebasish", label: "Twitter" },
    { icon: Instagram, href: "https://www.instagram.com/sildebasish02?igsh=MWN4dmdkZDZvNjYxMg==", label: "Instagram" },
    { icon: Facebook, href: "https://www.facebook.com/share/19h1bGQxvK/", label: "Facebook" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="relative bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800/80 overflow-hidden">

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-green-500/4 dark:bg-green-500/6 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 py-14">

                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }}
                        variants={fadeUp} custom={0}
                        className="lg:col-span-2 space-y-5 flex flex-col items-center lg:items-start text-center lg:text-left">

                        <Link href="/" className="flex items-center gap-2.5 w-fit group">
                            <img
                                src="/GetMoneyPlanner.png"
                                alt="GetMoneyPlanner"
                                className="w-8 h-8 rounded-lg object-contain"
                                onError={(e) => {
                                    const t = e.currentTarget;
                                    t.style.display = "none";
                                    const fb = document.createElement("div");
                                    fb.className = "w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center";
                                    fb.innerHTML = '<span style="color:white;font-weight:900;font-size:13px">G</span>';
                                    t.parentNode?.insertBefore(fb, t);
                                }}
                            />
                            <div>
                                <span className="text-lg font-black text-gray-900 dark:text-white group-hover:text-green-500 transition-colors">
                                    GetMoneyPlanner
                                </span>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-normal">
                                    Your financial command center.
                                </p>
                            </div>
                        </Link>

                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-xs">
                            The all-in-one financial management platform for businesses, professionals, and families. Track, analyze, and grow your money with clarity.
                        </p>

                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                            {features.map((f, i) => (
                                <div key={i}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 rounded-lg text-xs text-gray-500 dark:text-slate-400 font-medium">
                                    <f.icon className="w-3 h-3 text-green-500 shrink-0" />
                                    {f.label}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                            {socials.map((s, i) => (
                                <a key={i} href={s.href}
                                    target={s.href.startsWith("http") ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/5 transition-all">
                                    <s.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {Object.entries(footerLinks).map(([section, links], si) => (
                            <motion.div
                                key={section}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                                variants={fadeUp} custom={si + 1}
                                className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                    {section}
                                </p>
                                <ul className="space-y-3">
                                    {links.map((link, li) => (
                                        <li key={li}>
                                            <Link href={link.href}
                                                className="text-sm text-gray-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors flex items-center gap-1 group w-fit mx-auto sm:mx-0">
                                                {link.name}
                                                <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp}
                    className="py-5 border-t border-gray-100 dark:border-slate-800/60">
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3">
                        {[
                            { icon: Shield, text: "Bank-level Security" },
                            { icon: RefreshCw, text: "Real-time Auto Sync" },
                            { icon: FileSpreadsheet, text: "PDF & Excel Export" },
                            { icon: Target, text: "Smart Goal Tracking" },
                        ].map((b, i) => (
                            <div key={i}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/5 dark:bg-green-500/8 border border-green-500/15 rounded-full text-xs font-medium text-gray-600 dark:text-slate-400">
                                <b.icon className="w-3.5 h-3.5 text-green-500" />
                                {b.text}
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="py-5 border-t border-gray-100 dark:border-slate-800/60 flex flex-col items-center text-center gap-3">

                    <p className="text-sm font-semibold">
                        Created with{" "}
                        <Heart className="w-3.5 h-3.5 inline text-red-500 fill-red-500 mx-0.5" />{" "}
                        by{" "}
                        <span className="bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent font-black">
                            Deba
                        </span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                            Copyright © {year} <span className="font-semibold">GetMoneyPlanner</span>. All Rights Reserved. Built with{" "}
                            <Heart className="w-3 h-3 inline text-red-400 fill-red-400" />{" "}
                            using Next.js, TypeScript & MongoDB.
                        </p>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                            <span>Version 1.0.0</span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                All systems operational
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}