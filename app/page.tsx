"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, BarChart3, Target, RefreshCw, TrendingUp, Shield, Zap, ChevronDown, Play, Check, Star, FileSpreadsheet, FileText, PiggyBank, Bell, Users, Building2, GraduationCap, Home, Sparkles, MoveRight, } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = to / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}>
      {children}
    </motion.section>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, index }: {
  icon: React.ElementType; title: string; desc: string; color: string; index: number;
}) {
  return (
    <motion.div
      variants={fadeUp} custom={index}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 overflow-hidden cursor-default flex flex-col items-center text-center">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}10 0%, transparent 70%)` }} />

      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>

      <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
        style={{ backgroundColor: color }} />
    </motion.div>
  );
}

function StepCard({ num, title, desc, index }: { num: string; title: string; desc: string; index: number }) {
  return (
    <motion.div variants={fadeUp} custom={index} className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-green-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
          {num}
        </div>
        {index < 2 && <div className="w-px flex-1 mt-3 bg-gradient-to-b from-green-500/40 to-transparent min-h-[40px]" />}
      </div>
      <div className="pb-8">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{title}</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function AudienceCard({ icon: Icon, label, desc, color, index }: {
  icon: React.ElementType; label: string; desc: string; color: string; index: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={index}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 rounded-2xl gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <p className="font-bold text-gray-900 dark:text-white">{label}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function TestimonialCard({ quote, name, role, rating, index }: {
  quote: string; name: string; role: string; rating: number; index: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={index}
      className="bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500">{role}</p>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
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

  const currencies = ["Every Rupee", "Every Dollar", "Every Euro", "Every Pound", "Every Yen"];
  const [currIdx, setCurrIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrIdx((i) => (i + 1) % currencies.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.985]);

  const headlineOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const headlineScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.96]);

  const buttonsOpacity = useTransform(scrollYProgress, [0.2, 0.55], [1, 0]);
  const buttonsScale = useTransform(scrollYProgress, [0.2, 0.55], [1, 0.95]);
  const buttonsY = useTransform(scrollYProgress, [0.2, 0.55], [0, -18]);

  const snapshotOpacity = useTransform(scrollYProgress, [0.5, 1], [1, 0]);
  const snapshotScale = useTransform(scrollYProgress, [0.5, 1], [1, 0.95]);

  const year = new Date().getFullYear();

  const features = [
    { icon: BarChart3, title: "Dashboard Analytics", color: "#8b5cf6", desc: "Real-time insights with beautiful charts. Track income, expenses, and trends at a glance with interactive visualizations." },
    { icon: RefreshCw, title: "Auto Sync", color: "#06b6d4", desc: "Link transaction categories to goals and budgets. Your data updates automatically — no manual entry needed." },
    { icon: Target, title: "Goal Tracking", color: "#10b981", desc: "Set savings, debt payoff, and investment milestones. Watch your progress with animated rings and smart projections." },
    { icon: FileSpreadsheet, title: "PDF & Excel Export", color: "#f59e0b", desc: "Export your financial data with one click. Professional reports in PDF and Excel, perfectly formatted every time." },
    { icon: TrendingUp, title: "Transaction Management", color: "#22c55e", desc: "Log, categorize, and analyze every transaction. Filter, search, and understand exactly where your money goes." },
    { icon: Shield, title: "Secure & Private", color: "#6366f1", desc: "Bank-level security with 2FA, session management, and encrypted data. Your finances stay yours." },
  ];

  const steps = [
    { num: "1", title: "Create your account", desc: "Sign up in seconds. Set your currency, monthly budget, and savings goals in your personalized profile." },
    { num: "2", title: "Add your transactions", desc: "Log income and expenses manually or let auto-sync pull data from your linked categories automatically." },
    { num: "3", title: "Track, analyze & grow", desc: "Watch your dashboard come alive with insights. Hit your goals, export reports, and take control of your finances." },
  ];

  const audiences = [
    { icon: Building2, label: "Businesses & Orgs", color: "#8b5cf6", desc: "Manage company finances, track departmental spending, and generate professional reports for stakeholders." },
    { icon: Users, label: "Personal Finance", color: "#06b6d4", desc: "Take full control of your personal budget, savings goals, and spending habits with ease." },
    { icon: GraduationCap, label: "Students & Young Pros", color: "#10b981", desc: "Build smart money habits early. Track student budgets, first salaries, and savings milestones." },
    { icon: Home, label: "Family Budgeting", color: "#f59e0b", desc: "Plan family expenses, set shared goals, and keep everyone on the same financial page." },
  ];

  const testimonials = [
    { quote: "GetMoneyPlanner transformed how our team tracks project budgets. The export feature alone saves us hours every month.", name: "Rajesh Kumar", role: "Finance Manager, TechCorp India", rating: 5 },
    { quote: "I finally understand where my money goes. The dashboard is beautiful and the goal tracking keeps me motivated.", name: "Priya Sharma", role: "Software Engineer, Bangalore", rating: 5 },
    { quote: "As a student, this is exactly what I needed. Simple, powerful, and the dark mode is perfect for late night budgeting.", name: "Arjun Mehta", role: "Engineering Student, Mumbai", rating: 5 },
  ];

  const stats = [
    { value: 10000, suffix: "+", label: "Transactions Tracked" },
    { value: 500, suffix: "+", label: "Goals Achieved" },
    { value: 98, suffix: "%", label: "User Satisfaction" },
    { value: 4, suffix: " types", label: "Export Formats" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-green-500/5 dark:bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/4 dark:bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <section ref={heroRef} className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 z-10">
        <motion.div style={{ y: heroY, scale: heroScale }} className="w-full max-w-5xl mx-auto text-center">

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            Production-Grade Financial Management
            <Sparkles className="w-4 h-4" />
          </motion.div>

          <motion.div style={{ opacity: headlineOpacity, scale: headlineScale }}>
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
              <span className="text-gray-900 dark:text-white">Take Control of</span>
              <br />
              <span className="inline-block relative align-bottom" style={{ overflow: "clip", overflowClipMargin: "0.2em" }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currencies[currIdx]}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className="block bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent"
                    style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
                    {currencies[currIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">You Earn & Spend</span>
            </h1>

            <p
              className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one financial planner for businesses, professionals, and families.
              Track transactions, hit your goals, and export beautiful reports — all in one place.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: buttonsOpacity, scale: buttonsScale, y: buttonsY }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              disabled={status === "loading"}
              onClick={handleGetStarted}
              className={`group flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 text-base ${status === "loading" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              {status === "loading" ? "Loading..." : "Start for Free"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link href="/features"
              className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 text-base">
              <Play className="w-4 h-4" />
              See Features
            </Link>
          </motion.div>

          <motion.div
            style={{ opacity: snapshotOpacity, scale: snapshotScale }}
            className="relative mx-auto max-w-4xl">

            <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent blur-2xl -z-10 translate-y-4 scale-95 rounded-3xl" />

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-xs text-gray-400 dark:text-slate-400 text-left">
                  getmoneyplanner.app/dashboard
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-950">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Total Income", value: "₹1,20,000", color: "#22c55e", up: true },
                    { label: "Expenses", value: "₹68,500", color: "#ef4444", up: false },
                    { label: "Net Savings", value: "₹51,500", color: "#8b5cf6", up: true },
                    { label: "Goals", value: "3 Active", color: "#f59e0b", up: true },
                  ].map((c, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{c.label}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{c.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-xs" style={{ color: c.color }}>{c.up ? "↑" : "↓"} This month</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Monthly Overview</p>
                    <span className="text-xs text-green-500 font-medium">↑ 12.4% vs last month</span>
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {[60, 80, 45, 90, 70, 85, 55, 95, 65, 75, 88, 72].map((h, i) => (
                      <motion.div key={i} className="flex-1 rounded-t-md"
                        style={{ backgroundColor: i % 2 === 0 ? "#22c55e" : "#8b5cf6", opacity: 0.7 + (i % 3) * 0.1 }}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.9 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-3">Recent Transactions</p>
                  <div className="space-y-2">
                    {[
                      { label: "Salary", cat: "Income", amount: "+₹80,000", color: "#22c55e" },
                      { label: "Rent", cat: "Utilities", amount: "-₹15,000", color: "#ef4444" },
                      { label: "Food", cat: "Food & Dining", amount: "-₹3,200", color: "#f59e0b" },
                    ].map((t, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1 + i * 0.08 }}
                        className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{t.label}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{t.cat}</p>
                        </div>
                        <span className="text-xs font-bold" style={{ color: t.color }}>{t.amount}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      <Section className="relative z-10 py-16 border-y border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1">
                  <Counter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-500 mb-3">Built for everyone</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              One Platform, Every Financial Need
            </h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
              Whether you're managing a business or your personal savings, GetMoneyPlanner adapts to you.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {audiences.map((a, i) => (
              <AudienceCard key={i} {...a} index={i} />
            ))}
          </div>
        </div>
      </Section>

      <Section className="relative z-10 py-20 px-4 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Everything you need</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Powerful Features, Zero Complexity
            </h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
              From transaction logging to PDF exports, every feature is designed to save you time and give you clarity.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} index={i} />
            ))}
          </div>
          <motion.div variants={fadeUp} custom={6} className="text-center mt-10">
            <Link href="/features"
              className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:gap-3 transition-all duration-200">
              Explore all features <MoveRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </Section>

      <Section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div variants={fadeUp}>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-500 mb-3">Simple to start</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Up and Running in 3 Steps
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mb-10">
                No complex setup. No learning curve. Just sign up and start taking control of your finances today.
              </p>
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-green-500/25 hover:scale-105 w-full sm:w-auto">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <div>
              {steps.map((s, i) => <StepCard key={i} {...s} index={i} />)}
            </div>
          </div>
        </div>
      </Section>

      <Section className="relative z-10 py-20 px-4 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <motion.div variants={fadeUp}>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Export & Reports</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Beautiful Reports, One Click Away
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
                Generate professional PDF and Excel reports instantly. Perfect for business reviews, tax filing, or personal records. Every report is formatted to look like it was made by a professional accountant.
              </p>
              <div className="space-y-3">
                {[
                  "PDF reports with charts and summaries",
                  "Excel exports with proper number formatting",
                  "Filter by date range, category, or type",
                  "Share or download instantly",
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i}
                    className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-slate-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="relative">
              <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-3xl" />
              <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-900 dark:text-white">Financial Report</p>
                  <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full font-semibold">April {year}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Total Income", val: "₹1,20,000", color: "#22c55e" },
                    { label: "Total Expense", val: "₹68,500", color: "#ef4444" },
                    { label: "Net Savings", val: "₹51,500", color: "#8b5cf6" },
                    { label: "Goals Met", val: "2 / 3", color: "#f59e0b" },
                  ].map((r, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 dark:text-slate-500">{r.label}</p>
                      <p className="font-bold text-sm mt-0.5" style={{ color: r.color }}>{r.val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">Export PDF</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-3 py-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">Export Excel</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      <Section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-500 mb-3">Loved by users</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Real People, Real Results
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} index={i} />
            ))}
          </div>
        </div>
      </Section>

      <Section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp}
            className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-10 sm:p-14 text-center shadow-2xl shadow-green-500/25">
            {/* BG pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <motion.div variants={fadeUp} custom={0} className="relative z-10">
              <Zap className="w-10 h-10 text-white/80 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Start Managing Your Money Smarter
              </h2>
              <p className="text-green-100 mb-8 text-lg">
                Join thousands who've taken control of their finances. Free to start, powerful to grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-2xl hover:bg-green-50 transition-all shadow-lg hover:scale-105">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-all">
                  Sign In
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Section>
    </div>
  );
}