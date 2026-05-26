// app/goals/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Edit2, Trash2, Check, X, ChevronRight, Loader2, AlertCircle, CheckCircle2, Info, TrendingUp, PiggyBank, CreditCard, Star, Clock, BarChart3, Pause, Play, Search, Calendar, Trophy, Zap, Sparkles, RefreshCw, Link, Hand, Layers, ChevronDown, } from "lucide-react";

type GoalType = "savings" | "debt" | "investment" | "custom";
type GoalStatus = "active" | "completed" | "paused";
type TrackMode = "manual" | "auto" | "both";

interface Contribution {
  _id: string;
  amount: number;
  note: string;
  date: string;
  source: "manual" | "auto";
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string | null;
  icon: string;
  color: string;
  trackingMode: TrackMode;
  linkedCategory: string | null;
  linkedType: "income" | "expense";
  contributions: Contribution[];
  progressPercent: number;
  createdAt: string;
}

interface Stats {
  total: number; active: number; completed: number; paused: number;
  totalSaved: number; totalTarget: number;
}

interface Toast { type: "success" | "error" | "info"; message: string; }

const GOAL_TYPES = [
  { value: "savings" as GoalType, label: "Savings Goal", icon: PiggyBank, desc: "Save for something specific" },
  { value: "debt" as GoalType, label: "Debt Payoff", icon: CreditCard, desc: "Pay off a loan or card" },
  { value: "investment" as GoalType, label: "Investment Target", icon: TrendingUp, desc: "Grow your portfolio" },
  { value: "custom" as GoalType, label: "Custom Goal", icon: Star, desc: "Any financial milestone" },
];

const TRACKING_MODES = [
  { value: "manual" as TrackMode, label: "Manual", icon: Hand, desc: "You add progress yourself" },
  { value: "auto" as TrackMode, label: "Auto", icon: Link, desc: "Sync from a transaction category" },
  { value: "both" as TrackMode, label: "Both", icon: Layers, desc: "Auto-sync + manual contributions" },
];

const INCOME_CATEGORIES = ["Salary", "Freelance", "Business", "Investment", "Rental", "Gift", "Bonus", "Other Income"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Utilities", "Rent", "Insurance", "Other Expense"];

const CURRENCIES = [
  { value: "USD", symbol: "$" }, { value: "EUR", symbol: "€" },
  { value: "GBP", symbol: "£" }, { value: "BDT", symbol: "৳" },
  { value: "INR", symbol: "₹" }, { value: "JPY", symbol: "¥" },
];

const GOAL_ICONS = ["🎯", "💰", "🏠", "🚗", "✈️", "📚", "💍", "🏥", "🎓", "🌴", "💻", "🎮", "🐾", "🎸", "🏋️", "🛡️", "🌟", "🎪"];
const GOAL_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#f97316", "#84cc16"];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const sym = (code: string) => CURRENCIES.find((c) => c.value === code)?.symbol || "$";

function fmt(amount: number, currency = "USD") {
  return `${sym(currency)}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return { label: "Overdue", cls: "text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400" };
  if (d === 0) return { label: "Due today", cls: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" };
  return { label: `${d}d left`, cls: "text-gray-500 dark:text-slate-500" };
}

function trackingLabel(mode: TrackMode) {
  return TRACKING_MODES.find((t) => t.value === mode) ?? TRACKING_MODES[0];
}

function ToastBar({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4200); return () => clearTimeout(t); }, [onClose]);
  const s = {
    success: "bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-100",
    error: "bg-red-50 dark:bg-red-950/95 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-100",
    info: "bg-white dark:bg-slate-900/95 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-100",
  };
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-gray-400 shrink-0" />,
  };
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm animate-toast-in ${s[toast.type]}`}>
      {icons[toast.type]}
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-1"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function Ring({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5}
        className="text-gray-200 dark:text-slate-700" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, index }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent: string; index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl p-5 backdrop-blur-sm flex flex-col items-center text-center">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function GoalCard({ goal, index, onEdit, onDelete, onContribute, onStatusChange, onResync }: {
  goal: Goal;
  index: number;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onContribute: (g: Goal) => void;
  onStatusChange: (id: string, s: GoalStatus) => void;
  onResync: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (descRef.current) {
      setIsTruncated(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  }, [goal.description]);

  const TypeIcon = GOAL_TYPES.find((t) => t.value === goal.type)?.icon ?? Target;
  const dl = daysLeft(goal.deadline);
  const isCompleted = goal.status === "completed";
  const isPaused = goal.status === "paused";
  const TrackIcon = trackingLabel(goal.trackingMode).icon;
  const canManual = goal.trackingMode !== "auto";
  const autoCount = goal.contributions?.filter((c) => c.source === "auto").length ?? 0;
  const manualCount = goal.contributions?.filter((c) => c.source === "manual").length ?? 0;

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-white dark:bg-slate-900/70 border rounded-2xl overflow-hidden backdrop-blur-sm
        transition-shadow duration-200 hover:shadow-lg
        ${isCompleted ? "border-emerald-200 dark:border-emerald-800/40"
          : isPaused ? "border-gray-200 dark:border-slate-700/50 opacity-75"
            : "border-gray-200 dark:border-slate-800/70"}`}>
      <div className="h-1" style={{ backgroundColor: isCompleted ? "#10b981" : goal.color }} />

      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${isCompleted ? "#10b981" : goal.color}18`, border: `1px solid ${isCompleted ? "#10b981" : goal.color}30` }}>
              {isCompleted ? "🏆" : goal.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-tight truncate">{goal.title}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <TypeIcon className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                  <span className="text-xs text-gray-400 dark:text-slate-500 capitalize">
                    {GOAL_TYPES.find((t) => t.value === goal.type)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800">
                  <TrackIcon className="w-2.5 h-2.5 text-gray-400 dark:text-slate-500" />
                  <span className="text-xs text-gray-400 dark:text-slate-500 capitalize">{goal.trackingMode}</span>
                </div>
                {goal.linkedCategory && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                    {goal.linkedCategory}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
              ${isCompleted ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : isPaused ? "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"}`}>
              {goal.status}
            </span>

            <div className="relative" ref={ref}>
              <button onClick={() => setOpen(!open)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    <button onClick={() => { onEdit(goal); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Goal
                    </button>
                    {canManual && !isCompleted && (
                      <button onClick={() => { onContribute(goal); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add Contribution
                      </button>
                    )}
                    {(goal.trackingMode === "auto" || goal.trackingMode === "both") && (
                      <button onClick={() => { onResync(goal._id); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" /> Re-sync Transactions
                      </button>
                    )}
                    {!isCompleted && (
                      <button onClick={() => { onStatusChange(goal._id, isPaused ? "active" : "paused"); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {isPaused ? "Resume" : "Pause"}
                      </button>
                    )}
                    <div className="border-t border-gray-100 dark:border-slate-800" />
                    <button onClick={() => { onDelete(goal._id); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            <Ring pct={goal.progressPercent} color={isCompleted ? "#10b981" : goal.color} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-sm font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}>
                {goal.progressPercent}%
              </motion.span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between mb-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{fmt(goal.currentAmount, goal.currency)}</span>
              <span className="text-xs text-gray-400 dark:text-slate-500">of {fmt(goal.targetAmount, goal.currency)}</span>
            </div>
            <ProgressBar pct={goal.progressPercent} color={isCompleted ? "#10b981" : goal.color} />
            <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {fmt(Math.max(0, goal.targetAmount - goal.currentAmount), goal.currency)} to go
              </span>
              {dl && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${dl.cls}`}>
                  <Clock className="w-3 h-3" />{dl.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {(autoCount > 0 || manualCount > 0) && (
          <div className="flex items-center gap-2 mb-3">
            {autoCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <Link className="w-3 h-3" />{autoCount} auto
              </div>
            )}
            {manualCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <Hand className="w-3 h-3" />{manualCount} manual
              </div>
            )}
          </div>
        )}

        {goal.description && (
          <div className="mb-4">
            <p ref={descRef} className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed line-clamp-2">
              {goal.description}
            </p>
            {isTruncated && (
              <motion.button
                onClick={() => setShowDesc(true)}
                className="text-xs font-medium mt-1 hover:underline cursor-pointer"
                style={{ color: isCompleted ? "#10b981" : goal.color }}>
                Read more
              </motion.button>
            )}
          </div>
        )}
        <div className="flex-1" />

        {isCompleted ? (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Trophy className="w-4 h-4" /> Goal Achieved!
          </div>
        ) : isPaused ? (
          <button onClick={() => onStatusChange(goal._id, "active")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer">
            <Play className="w-4 h-4" /> Resume Goal
          </button>
        ) : goal.trackingMode === "auto" ? (
          <button onClick={() => onResync(goal._id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
            style={{ borderColor: `${goal.color}50`, color: goal.color, backgroundColor: `${goal.color}08` }}>
            <RefreshCw className="w-4 h-4" /> Sync from Transactions
          </button>
        ) : (
          <button onClick={() => onContribute(goal)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
            style={{ backgroundColor: goal.color }}>
            <Plus className="w-4 h-4" /> Add Contribution
          </button>
        )}

        <AnimatePresence>
          {showDesc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowDesc(false)}>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-lg p-6"
                style={{ border: `1px solid ${isCompleted ? "#10b981" : goal.color}30` }}>

                <button
                  onClick={() => setShowDesc(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition text-lg cursor-pointer">
                  ✕
                </button>

                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"
                  style={{ color: isCompleted ? "#10b981" : goal.color }}>
                  <span className="text-xl">{isCompleted ? "🏆" : goal.icon}</span>
                  {goal.title}
                </h3>

                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto pr-2 text-sm">
                  {goal.description}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDesc(false)}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md cursor-pointer"
                    style={{ backgroundColor: isCompleted ? "#10b981" : goal.color }}>
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-modal-in">
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 px-4 py-2.5 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70";

function GoalForm({ initial, onSave, onClose, saving }: {
  initial?: Partial<Goal>;
  onSave: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const isEdit = !!initial?._id;

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState<GoalType>(initial?.type || "savings");
  const [targetAmount, setTargetAmount] = useState(String(initial?.targetAmount || ""));
  const [currentAmount, setCurrentAmount] = useState(String(initial?.currentAmount || ""));
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [deadline, setDeadline] = useState(initial?.deadline ? initial.deadline.slice(0, 10) : "");
  const [icon, setIcon] = useState(initial?.icon || "🎯");
  const [color, setColor] = useState(initial?.color || "#8b5cf6");
  const [trackingMode, setTrackingMode] = useState<TrackMode>(initial?.trackingMode || "manual");
  const [linkedCategory, setLinkedCategory] = useState(initial?.linkedCategory || "");
  const [linkedType, setLinkedType] = useState<"income" | "expense">(initial?.linkedType || "income");

  const categories = linkedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const needsCategory = trackingMode === "auto" || trackingMode === "both";

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">{isEdit ? "Edit Goal" : "New Financial Goal"}</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{isEdit ? "Update goal details" : "Set a new milestone to work toward"}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Goal Type</label>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.value;
              return (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer
                    ${active ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40"
                      : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600"}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-slate-500"}`} />
                  <div>
                    <p className={`text-xs font-semibold ${active ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-slate-300"}`}>{t.label}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Title <span className="text-violet-500">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Emergency Fund" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Description</label>
            <span className={`text-xs ${(description?.length || 0) > 450 ? (description?.length || 0) > 490 ? "text-red-500" : "text-amber-500" : "text-gray-400 dark:text-slate-500"}`}>
              {description?.length || 0}/500
            </span>
          </div>
          <textarea value={description} onChange={(e) => {
            if (e.target.value.length <= 500) setDescription(e.target.value)
          }}
            placeholder="Why is this goal important?" rows={2} className={`${inputCls} resize-none ${description.length >= 500 ? "!border-red-400 focus:!border-red-400 focus:!ring-red-400/20" : ""}`} />
          {description.length >= 500 && (
            <p className="text-xs text-red-500">Maximum 500 characters reached</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Target Amount <span className="text-violet-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">{sym(currency)}</span>
              <input type="number" min="1" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="5000" className={`${inputCls} pl-7`} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Already Saved</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">{sym(currency)}</span>
                <input type="number" min="0" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" className={`${inputCls} pl-7`} onWheel={(e) => e.currentTarget.blur()} />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Currency</label>
            <div className="relative">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputCls} appearance-none pr-9 cursor-pointer`}>
                {CURRENCIES.map((c) => <option key={c.value} value={c.value} className="bg-white dark:bg-slate-900">{c.value}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Target Date</label>

            <div className="relative">
              <div
                onClick={() => {
                  const input = document.getElementById("goal-deadline-input") as HTMLInputElement;
                  if (input) {
                    try { input.showPicker(); } catch { input.click(); }
                  }
                }}
                className={`${inputCls} flex items-center justify-between cursor-pointer`}>
                <span className={deadline ? "text-gray-800 dark:text-slate-200" : "text-gray-400 dark:text-slate-500"}>
                  {deadline
                    ? new Date(deadline + "T00:00:00").toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })
                    : "Select date"}
                </span>
                <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
              </div>
              <input
                id="goal-deadline-input"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="sr-only scheme-light dark:scheme-dark"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Progress Tracking</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TRACKING_MODES.map((m) => {
              const Icon = m.icon;
              const active = trackingMode === m.value;
              return (
                <button key={m.value} type="button" onClick={() => setTrackingMode(m.value)}
                  className={`flex flex-col items-center gap-1 sm:gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer
                    ${active ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40"
                      : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600"}`}>
                  <div className="flex items-center gap-2 sm:flex-col sm:gap-1.5">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-slate-500"}`} />
                    <p className={`text-sm sm:text-xs font-semibold ${active ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-slate-300"}`}>{m.label}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 leading-tight">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {needsCategory && (
          <div className="space-y-3 p-4 bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-violet-500" />
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Link a Transaction Category</p>
            </div>
            <p className="text-xs text-violet-600/70 dark:text-violet-400/70 leading-relaxed">
              Transactions matching this category will automatically count toward this goal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["income", "expense"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setLinkedType(t); setLinkedCategory(""); }}
                  className={`py-2 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer
                    ${linkedType === t
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600"}`}>
                  {t} transactions
                </button>
              ))}
            </div>
            <div className="relative">
              <select value={linkedCategory} onChange={(e) => setLinkedCategory(e.target.value)}
                className={`${inputCls} appearance-none pr-9 cursor-pointer`}>
                <option value="" className="bg-white dark:bg-slate-900">— Select category —</option>
                {categories.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
            </div>
            {linkedCategory && (
              <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  All <strong>{linkedType}</strong> transactions in <strong>{linkedCategory}</strong> will count automatically.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Icon</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_ICONS.map((em) => (
              <button key={em} type="button" onClick={() => setIcon(em)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer
                  ${icon === em ? "bg-violet-100 dark:bg-violet-500/20 ring-2 ring-violet-400" : "bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700"}`}>
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Color</label>
          <div className="flex gap-2 flex-wrap">
            {GOAL_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all cursor-pointer ${color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-gray-400 scale-110" : "hover:scale-110"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-800">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer">
          Cancel
        </button>
        <button
          onClick={() => onSave({ title, description, type, targetAmount: Number(targetAmount), currentAmount: Number(currentAmount) || 0, currency, deadline: deadline || null, icon, color, trackingMode, linkedCategory: linkedCategory || null, linkedType })}
          disabled={saving || !title.trim() || !targetAmount || (needsCategory && !linkedCategory)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-violet-900/20">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isEdit ? "Update Goal" : "Create Goal"}
        </button>
      </div>
    </>
  );
}

function ContributeModal({ goal, onSave, onClose, saving }: {
  goal: Goal; onSave: (amount: number, note: string) => void; onClose: () => void; saving: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const quickAmounts = [
    Math.round(remaining * 0.1),
    Math.round(remaining * 0.25),
    Math.round(remaining * 0.5),
    remaining,
  ].filter((a) => a > 0 && a <= remaining);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${goal.color}18` }}>{goal.icon}</div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{goal.title}</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Manual contribution</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/40 rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">Progress</span>
            <span className="text-xs font-semibold" style={{ color: goal.color }}>{goal.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {/* <div className="h-full rounded-full" style={{ width: `${goal.progressPercent}%`, backgroundColor: goal.color }} /> */}
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${goal.progressPercent}%`, backgroundColor: goal.color }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">{fmt(goal.currentAmount, goal.currency)} saved</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">{fmt(remaining, goal.currency)} to go</span>
          </div>
        </div>

        {quickAmounts.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Quick Add</label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((a) => (
                <button key={a} type="button" onClick={() => setAmount(String(a))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer
                    ${amount === String(a) ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600"}`}>
                  {sym(goal.currency)}{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Amount <span className="text-violet-500">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 font-medium">{sym(goal.currency)}</span>
            <input type="number" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className={`${inputCls} pl-7`} onWheel={(e) => e.currentTarget.blur()} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Monthly savings, bonus…" className={inputCls} />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-800">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer">Cancel</button>
        <button onClick={() => onSave(Number(amount), note)} disabled={saving || !amount || Number(amount) <= 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: goal.color }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Add {amount ? fmt(Number(amount), goal.currency) : "Money"}
        </button>
      </div>
    </>
  );
}

function BudgetInsightCard({ monthlyBudget, savingsGoalPercent, currency, stats }: {
  monthlyBudget: number; savingsGoalPercent: number; currency: string; stats: Stats;
}) {
  if (!monthlyBudget || monthlyBudget <= 0) return null;

  const monthlySavingsTarget = Math.round((monthlyBudget * savingsGoalPercent) / 100);
  const totalSaved = stats.totalSaved;
  const totalTarget = stats.totalTarget;
  const remainingAmount = Math.max(0, totalTarget - totalSaved);
  const monthsToComplete = monthlySavingsTarget > 0 ? Math.ceil(remainingAmount / monthlySavingsTarget) : null;
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <motion.div
      variants={fadeUp}
      custom={0}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-slate-900/70 border border-violet-200 dark:border-violet-800/40 rounded-2xl p-5 mb-6 backdrop-blur-sm">

      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Monthly Budget Insight</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Based on your profile settings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden mb-4">
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50/50 dark:bg-slate-800/20">
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{fmt(monthlyBudget, currency)}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 text-center">Monthly Budget</p>
        </div>

        <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50/50 dark:bg-slate-800/20">
          <p className="text-base sm:text-lg font-bold text-violet-600 dark:text-violet-400">{fmt(monthlySavingsTarget, currency)}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 text-center">Save/month ({savingsGoalPercent}%)</p>
        </div>

        {monthsToComplete !== null && totalTarget > 0 && (
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50/50 dark:bg-slate-800/20 col-span-2 sm:col-span-1 border-t border-gray-100 dark:border-slate-800 sm:border-t-0r">
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{monthsToComplete}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 text-center">Months to finish all goals</p>
          </div>
        )}
      </div>

      {
        totalTarget > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">All goals progress</span>
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                {fmt(totalSaved, currency)} of {fmt(totalTarget, currency)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              />
            </div>
            <div className="flex items-start gap-2 mt-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                {monthsToComplete !== null && monthsToComplete > 0
                  ? `At ${fmt(monthlySavingsTarget, currency)}/month savings, you'll complete all your goals in approximately ${monthsToComplete} month${monthsToComplete > 1 ? "s" : ""}. The 50/30/20 rule recommends saving ${savingsGoalPercent}% of your income.`
                  : totalTarget > 0 && totalSaved >= totalTarget
                    ? "🎉 All your goals are complete! Set new ones to keep growing."
                    : "Set a monthly budget in your Profile → Financial Setup to see projections here."}
              </p>
            </div>
          </div>
        )
      }
    </motion.div >
  );
}

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userCurrency, setUserCurrency] = useState("USD");
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [savingsGoalPercent, setSavingsGoalPercent] = useState(20);

  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const show = useCallback((type: Toast["type"], msg: string) => setToast({ type, message: msg }), []);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          if (d.user.currency) setUserCurrency(d.user.currency);
          if (d.user.monthlyBudget) setMonthlyBudget(Number(d.user.monthlyBudget));
          if (d.user.savingsGoalPercent) setSavingsGoalPercent(Number(d.user.savingsGoalPercent));
        }
      })
      .catch(() => { });
  }, [status]);

  const fetchGoals = useCallback(async (sync = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/goals?status=${filter}${sync ? "&sync=true" : ""}`);
      const data = await res.json();
      if (data.success) { setGoals(data.goals); setStats(data.stats); }
      else show("error", data.error || "Failed to load goals");
    } catch { show("error", "Failed to load goals"); }
    finally { setLoading(false); }
  }, [filter, show]);

  useEffect(() => { if (status === "authenticated") fetchGoals(true); }, [status, fetchGoals]);

  const displayed = goals.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    (g.description || "").toLowerCase().includes(search.toLowerCase())
  );

  async function apiGoal(url: string, method: string, body: object) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  function gid(id: any): string { return String(id); }

  async function handleCreate(data: any) {
    try {
      setSaving(true); const d = await apiGoal("/api/goals", "POST", data);
      d.success ? (show("success", d.message), setShowForm(false), fetchGoals()) : show("error", d.error);
    } catch { show("error", "Something went wrong"); } finally { setSaving(false); }
  }

  async function handleEdit(data: any) {
    if (!editGoal) return;
    try {
      setSaving(true); const d = await apiGoal(`/api/goals/${gid(editGoal._id)}`, "PUT", { action: "update", ...data });
      d.success ? (show("success", d.message), setEditGoal(null), fetchGoals()) : show("error", d.error);
    } catch { show("error", "Something went wrong"); } finally { setSaving(false); }
  }

  async function handleContribute(amount: number, note: string) {
    if (!contributeGoal) return;
    try {
      setSaving(true); const d = await apiGoal(`/api/goals/${gid(contributeGoal._id)}`, "PUT", { action: "contribute", amount, note });
      d.success ? (show("success", d.message), setContributeGoal(null), fetchGoals()) : show("error", d.error);
    } catch { show("error", "Something went wrong"); } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, newStatus: GoalStatus) {
    try {
      const d = await apiGoal(`/api/goals/${gid(id)}`, "PUT", { action: "updateStatus", status: newStatus });
      d.success ? (show("success", d.message), fetchGoals()) : show("error", d.error);
    } catch { show("error", "Something went wrong"); }
  }

  async function handleResync(id: string) {
    try {
      show("info", "Syncing transactions…");
      const d = await apiGoal(`/api/goals/${gid(id)}`, "PUT", { action: "resync" });
      d.success ? (show("success", d.message), fetchGoals()) : show("error", d.error);
    } catch { show("error", "Something went wrong"); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      setDeleteSaving(true);
      const res = await fetch(`/api/goals/${gid(deleteId)}`, { method: "DELETE" });
      const d = await res.json();
      d.success ? (show("success", d.message), setDeleteId(null), fetchGoals()) : show("error", d.error);
    } catch { show("error", "Something went wrong"); } finally { setDeleteSaving(false); }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
          <p className="text-gray-400 dark:text-slate-400 text-sm">Loading goals…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

      {showForm && <Modal onClose={() => setShowForm(false)}>      <GoalForm onSave={handleCreate} onClose={() => setShowForm(false)} saving={saving} /></Modal>}
      {editGoal && <Modal onClose={() => setEditGoal(null)}>       <GoalForm initial={editGoal} onSave={handleEdit} onClose={() => setEditGoal(null)} saving={saving} /></Modal>}
      {contributeGoal && <Modal onClose={() => setContributeGoal(null)}><ContributeModal goal={contributeGoal} onSave={handleContribute} onClose={() => setContributeGoal(null)} saving={saving} /></Modal>}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Delete Goal</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500">All contribution history will be lost</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} disabled={deleteSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer">
                {deleteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-violet-600/3 dark:bg-violet-600/4 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-600/3 dark:bg-indigo-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible" className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 mb-3">
            <span>Dashboard</span><ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 dark:text-slate-300 font-medium">Financial Goals</span>
          </nav>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                Financial Goals <Sparkles className="w-6 h-6 text-violet-500" />
              </h1>
              <p className="text-gray-400 dark:text-slate-400 mt-1 text-sm">
                Track savings, debt payoff, and investment milestones — manually or automatically via transaction categories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchGoals(true)} title="Sync all auto-tracked goals"
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4" /> Sync
              </button>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-900/20">
                <Plus className="w-4 h-4" /> New Goal
              </button>
            </div>
          </div>
        </motion.div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard index={0} label="Total Goals" value={String(stats.total)} icon={Target} accent="#8b5cf6" sub={`${stats.active} active`} />
            <StatCard index={1} label="Completed" value={String(stats.completed)} icon={Trophy} accent="#10b981" sub={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% success rate` : undefined} />
            <StatCard index={2} label="Total Saved" value={fmt(stats.totalSaved, userCurrency)} icon={PiggyBank} accent="#3b82f6" />
            <StatCard index={3} label="Overall" value={stats.totalTarget > 0 ? `${Math.round((stats.totalSaved / stats.totalTarget) * 100)}%` : "0%"} icon={BarChart3} accent="#f59e0b" sub={`of ${fmt(stats.totalTarget, userCurrency)} target`} />
          </div>
        )}

        {stats && monthlyBudget > 0 && (
          <BudgetInsightCard
            monthlyBudget={monthlyBudget}
            savingsGoalPercent={savingsGoalPercent}
            currency={userCurrency}
            stats={stats}
          />
        )}

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 p-1 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-xl">
            {STATUS_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${filter === f.value ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search goals…"
              className="w-full bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-xl text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 pl-10 pr-4 py-2 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {displayed.length === 0 ? (
            <motion.div
              key="empty"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {search ? "No matching goals" : filter !== "all" ? `No ${filter} goals` : "No goals yet"}
              </h3>
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">
                {search || filter !== "all" ? "Try adjusting your search or filter." : "Create your first financial goal and start tracking progress."}
              </p>
              {!search && filter === "all" && (
                <button onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-900/20">
                  <Plus className="w-4 h-4" /> Create First Goal
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayed.map((goal, i) => (
                <GoalCard key={goal._id} goal={goal} index={i}
                  onEdit={setEditGoal} onDelete={setDeleteId}
                  onContribute={setContributeGoal}
                  onStatusChange={handleStatusChange}
                  onResync={handleResync} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes toast-in { from { opacity:0; transform:translateX(1.5rem) scale(.95); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes modal-in { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .animate-toast-in { animation: toast-in .22s cubic-bezier(.16,1,.3,1) both; }
        .animate-modal-in { animation: modal-in .2s cubic-bezier(.16,1,.3,1) both; }
      `}</style>
    </div>
  );
}