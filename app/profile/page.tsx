"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Shield, Bell, Camera, Eye, EyeOff, Check, X, ChevronRight, Lock, Globe, DollarSign, Clock, Loader2, AlertCircle, CheckCircle2, Smartphone, Mail, Phone, Download, Trash2, Monitor, MapPin, AlertTriangle, Target, FileText, Activity, BarChart3, TrendingUp, RefreshCw, LogOut, Info, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TwoFactorSetup from "@/components/TwoFactorSetup";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    bio: string;
    currency: string;
    timezone: string;
    language: string;
    dateFormat: string;
    monthlyBudget: number;
    savingsGoalPercent: number;
    notifications: {
        emailAlerts: boolean;
        pushAlerts: boolean;
        weeklyReport: boolean;
        monthlyReport: boolean;
        transactionAlerts: boolean;
        budgetAlerts: boolean;
        goalAlerts: boolean;
        unusualActivity: boolean;
    };
    privacy: {
        profileVisible: boolean;
        dataSharing: boolean;
        analyticsOptIn: boolean;
    };
    twoFactorEnabled: boolean;
    sessions: { id: string; device: string; location: string; lastActive: string; expiresAt?: string | null }[];
    createdAt: string | null;
    lastLogin: string | null;
    stats: { totalTransactions: number; totalGoals: number };
}

interface Toast { type: "success" | "error" | "info"; message: string; }

const CURRENCIES = [
    { value: "USD", label: "US Dollar (USD)", symbol: "$" },
    { value: "EUR", label: "Euro (EUR)", symbol: "€" },
    { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
    { value: "BDT", label: "Bangladeshi Taka (BDT)", symbol: "৳" },
    { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
    { value: "JPY", label: "Japanese Yen (JPY)", symbol: "¥" },
    { value: "CAD", label: "Canadian Dollar (CAD)", symbol: "$" },
    { value: "AUD", label: "Australian Dollar (AUD)", symbol: "$" },
    { value: "SGD", label: "Singapore Dollar (SGD)", symbol: "$" },
    { value: "AED", label: "UAE Dirham (AED)", symbol: "د.إ" },
];

const TIMEZONES = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (ET) — UTC-5/4" },
    { value: "America/Chicago", label: "Central Time (CT) — UTC-6/5" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT) — UTC-8/7" },
    { value: "Europe/London", label: "London (GMT/BST) — UTC+0/1" },
    { value: "Europe/Paris", label: "Paris (CET/CEST) — UTC+1/2" },
    { value: "Asia/Dhaka", label: "Dhaka (BST) — UTC+6" },
    { value: "Asia/Kolkata", label: "India (IST) — UTC+5:30" },
    { value: "Asia/Tokyo", label: "Tokyo (JST) — UTC+9" },
    { value: "Asia/Dubai", label: "Dubai (GST) — UTC+4" },
    { value: "Australia/Sydney", label: "Sydney (AEDT) — UTC+11/10" },
];

const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "bn", label: "বাংলা (Bengali)" },
    { value: "fr", label: "Français (French)" },
    { value: "de", label: "Deutsch (German)" },
    { value: "es", label: "Español (Spanish)" },
    { value: "ar", label: "العربية (Arabic)" },
    { value: "ja", label: "日本語 (Japanese)" },
    { value: "zh", label: "中文 (Chinese)" },
];

const DATE_FORMATS = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
    { value: "DD MMM YYYY", label: "DD MMM YYYY (e.g. 25 Jan 2025)" },
];

const NAV_ITEMS = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "financial", label: "Financial Setup", icon: DollarSign },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Data", icon: Lock },
    { id: "sessions", label: "Active Sessions", icon: Monitor },
];


function ToastBar({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    const styles = {
        success: "bg-emerald-950/95 border-emerald-700/50 text-emerald-100",
        error: "bg-red-950/95 border-red-700/50 text-red-100",
        info: "bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700/50 text-gray-900 dark:text-slate-100",
    };
    const icons = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
        error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
        info: <Info className="w-4 h-4 text-gray-500 dark:text-slate-400 shrink-0" />,
    };
    return (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm animate-toast-in ${styles[toast.type]}`}>
            {icons[toast.type]}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
                <X className="w-3.5 h-3.5" />
            </motion.button>
        </div>
    );
}

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-950
            ${enabled ? "bg-violet-600" : "bg-gray-200 dark:bg-slate-700"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        </motion.button>
    );
}

function Card({ title, subtitle, icon: Icon, children, className = "" }: {
    title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode; className?: string;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.008, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
            transition={{ duration: 0.2 }}
            className={`bg-white/90 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm ${className}`}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800/50 flex items-center gap-3">
                {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-400" />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="p-6">{children}</div>
        </motion.div>
    );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                {label}{required && <span className="text-violet-400 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 px-4 py-2.5 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70";
const iconInputCls = "w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 pl-10 pr-4 py-2.5 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70";

function TextInput({ value, onChange, placeholder, icon: Icon, disabled, type = "text" }: {
    value: string; onChange?: (v: string) => void; placeholder?: string; icon?: React.ElementType; disabled?: boolean; type?: string;
}) {
    return (
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />}
            <input
                type={type} value={value} placeholder={placeholder} disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
                className={`${Icon ? iconInputCls : inputCls} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            />
        </div>
    );
}

function SelectInput({ value, onChange, options, icon: Icon }: {
    value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; icon?: React.ElementType;
}) {
    return (
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />}
            <select
                value={value} onChange={(e) => onChange(e.target.value)}
                className={`${Icon ? iconInputCls : inputCls} appearance-none cursor-pointer pr-9`}>
                {options.map((o) => <option key={o.value} value={o.value} className="bg-white dark:bg-slate-900">{o.label}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 rotate-90 pointer-events-none" />
        </div>
    );
}

function SaveRow({ onSave, saving, note }: { onSave: () => void; saving: boolean; note?: string }) {
    return (
        <div className="mt-6 flex items-center justify-between gap-4 pt-5 border-t border-gray-200 dark:border-slate-800/50">
            {note ? <p className="text-xs text-gray-400 dark:text-slate-500 max-w-xs">{note}</p> : <span />}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 shrink-0 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
            </motion.button>
        </div>
    );
}

function NotifRow({ icon: Icon, title, desc, enabled, onChange }: {
    icon: React.ElementType; title: string; desc: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-3.5 border-b border-gray-200/80 dark:border-slate-800/40 last:border-0">
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    ${enabled ? "bg-violet-500/10 border border-violet-500/20" : "bg-gray-100/80 dark:bg-slate-800/60   border border-gray-200/80 dark:border-slate-700/40"}`}>
                    <Icon className={`w-3.5 h-3.5 ${enabled ? "text-violet-400" : "text-gray-400 dark:text-slate-500"}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{title}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{desc}</p>
                </div>
            </div>
            <Toggle enabled={enabled} onChange={onChange} />
        </div>
    );
}

function PrivacyRow({ title, desc, enabled, onChange, badge }: {
    title: string; desc: string; enabled: boolean; onChange: (v: boolean) => void; badge?: string;
}) {
    return (
        <div className="flex items-start justify-between py-4 border-b border-gray-200/80 dark:border-slate-800/40 last:border-0 gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{title}</p>
                    {badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">{desc}</p>
            </div>
            <Toggle enabled={enabled} onChange={onChange} />
        </div>
    );
}

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

function pwStrength(pw: string) {
    if (!pw) return { level: 0, label: "", color: "" };
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { level: s, label: "Weak", color: "bg-red-500" };
    if (s <= 3) return { level: s, label: "Fair", color: "bg-amber-500" };
    return { level: s, label: "Strong", color: "bg-emerald-500" };
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const [tab, setTab] = useState("personal");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState("");

    const [monthlyBudget, setMonthlyBudget] = useState("0");
    const [savingsGoalPercent, setSavingsGoalPercent] = useState("20");

    const [currency, setCurrency] = useState("USD");
    const [timezone, setTimezone] = useState("UTC");
    const [language, setLanguage] = useState("en");
    const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

    const [curPw, setCurPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confPw, setConfPw] = useState("");
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);

    const [notif, setNotif] = useState({
        emailAlerts: true, pushAlerts: false, weeklyReport: true, monthlyReport: true,
        transactionAlerts: true, budgetAlerts: true, goalAlerts: true, unusualActivity: true,
    });

    const [privacy, setPrivacy] = useState({ profileVisible: false, dataSharing: false, analyticsOptIn: true });

    const [deleteConfirmPw, setDeleteConfirmPw] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingSaving, setDeletingSaving] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const show = useCallback((type: Toast["type"], message: string) => setToast({ type, message }), []);

    useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/profile");
            const data = await res.json();
            if (data.success) {
                const u = data.user;
                setProfile(u);
                setName(u.name); setPhone(u.phone); setBio(u.bio); setAvatar(u.avatar);
                setCurrency(u.currency); setTimezone(u.timezone); setLanguage(u.language); setDateFormat(u.dateFormat);
                setMonthlyBudget(String(u.monthlyBudget)); setSavingsGoalPercent(String(u.savingsGoalPercent));
                setNotif(u.notifications); setPrivacy(u.privacy);
            }
        } catch { show("error", "Failed to load profile"); }
        finally { setLoading(false); }
    }, [show]);

    useEffect(() => {
        if (status !== "authenticated") return;
        fetchProfile();
    }, [status, fetchProfile]);

    async function apiPut(body: object) {
        const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        return res.json();
    }

    async function savePersonal() {
        if (!name.trim() || name.trim().length < 2) { show("error", "Name must be at least 2 characters"); return; }
        try {
            setSaving(true);
            const d = await apiPut({ action: "updateProfile", name, phone, bio, avatar });
            if (d.success) {
                show("success", d.message);
                await update();
                fetchProfile();
            } else {
                show("error", d.error);
            }
        } catch {
            show("error", "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    async function saveFinancial() {
        try {
            setSaving(true); const d = await apiPut({ action: "updatePreferences", currency, timezone, language, dateFormat, monthlyBudget, savingsGoalPercent });
            d.success ? show("success", d.message) : show("error", d.error);
        } catch { show("error", "Something went wrong"); } finally { setSaving(false); }
    }

    async function changePassword() {
        if (!curPw || !newPw || !confPw) { show("error", "All fields required"); return; }
        if (newPw.length < 8) { show("error", "Password must be at least 8 characters"); return; }
        if (newPw !== confPw) { show("error", "Passwords do not match"); return; }
        try {
            setSaving(true); const d = await apiPut({ action: "changePassword", currentPassword: curPw, newPassword: newPw });
            if (d.success) { show("success", d.message); setCurPw(""); setNewPw(""); setConfPw(""); } else show("error", d.error);
        }
        catch { show("error", "Something went wrong"); } finally { setSaving(false); }
    }

    async function saveNotifications() {
        try {
            setSaving(true); const d = await apiPut({ action: "updateNotifications", notifications: notif });
            d.success ? show("success", d.message) : show("error", d.error);
        } catch { show("error", "Something went wrong"); } finally { setSaving(false); }
    }

    async function savePrivacy() {
        try {
            setSaving(true); const d = await apiPut({ action: "updatePrivacy", privacy });
            d.success ? show("success", d.message) : show("error", d.error);
        } catch { show("error", "Something went wrong"); } finally { setSaving(false); }
    }

    async function revokeSession(id: string) {
        try {
            const d = await apiPut({ action: "revokeSession", sessionId: id });
            if (d.success) { show("success", d.message); setProfile((p) => p ? { ...p, sessions: p.sessions.filter((s) => s.id !== id) } : p); }
            else show("error", d.error);
        } catch { show("error", "Something went wrong"); }
    }

    async function revokeAllOthers() {
        const keepSessionId = profile?.sessions?.[0]?.id;
        try {
            const d = await apiPut({ action: "revokeAllOthers", keepSessionId });
            if (d.success) { show("success", d.message); fetchProfile(); }
            else show("error", d.error);
        } catch { show("error", "Something went wrong"); }
    }

    async function exportData() {
        try {
            setExportLoading(true);
            show("info", "Preparing your data export…");
            const d = await apiPut({ action: "exportData" });
            if (d.success) {
                const blob = new Blob([JSON.stringify(d.data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `getmoneyplanner-data-${new Date().toISOString().slice(0, 10)}.json`;
                a.click(); URL.revokeObjectURL(url);
                show("success", "Data exported successfully");
            } else show("error", d.error);
        } catch { show("error", "Export failed"); } finally { setExportLoading(false); }
    }

    async function deleteAccount() {
        if (!deleteConfirmPw) { show("error", "Please enter your password"); return; }
        try {
            setDeletingSaving(true);
            const res = await fetch("/api/profile", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmPassword: deleteConfirmPw }) });
            const data = await res.json();
            if (data.success) { await signOut({ callbackUrl: "/" }); }
            else show("error", data.error);
        } catch { show("error", "Something went wrong"); } finally { setDeletingSaving(false); }
    }

    const strength = pwStrength(newPw);

    if (loading || status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Loading profile…</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}>
            {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500">This action is permanent and irreversible</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
                            All your data including transactions, goals, and settings will be permanently deleted. Enter your password to confirm.
                        </p>
                        <input
                            type="password" value={deleteConfirmPw} onChange={(e) => setDeleteConfirmPw(e.target.value)}
                            placeholder="Enter your password to confirm"
                            className={`${inputCls} mb-4 border-red-500/30 focus:border-red-500/60`}
                        />
                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmPw(""); }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={deleteAccount} disabled={deletingSaving}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-gray-900 dark:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                                {deletingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete Account
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-violet-600/3 dark:bg-violet-600/4 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-600/4 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

                <div className="mb-8">
                    <nav className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 mb-3">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-gray-700 dark:text-slate-300 font-medium">Account Settings</span>
                    </nav>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
                            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Manage your profile, security, and financial preferences.</p>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="flex flex-col lg:flex-row gap-6 lg:gap-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>

                    <motion.aside
                        className="lg:w-64 shrink-0 space-y-4"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}>

                        <motion.div
                            whileHover={{ scale: 1.008, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/90 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl p-5 text-center backdrop-blur-sm">
                            <div className="relative inline-block mb-3">
                                {avatar ? (
                                    <img src={avatar} alt={name} className="w-18 h-18 rounded-2xl object-cover border-2 border-violet-500/30 w-[72px] h-[72px]" />
                                ) : (
                                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white border-2 border-violet-500/30 shadow-lg shadow-violet-900/30">
                                        {getInitials(name || "U")}
                                    </div>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setTab("personal")}
                                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-violet-400 dark:bg-violet-600 hover:bg-violet-300 dark:hover:bg-violet-500 rounded-lg flex items-center justify-center transition-colors shadow-lg">
                                    <Camera className="w-3 h-3 text-gray-900 dark:text-white" />
                                </motion.button>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{profile?.name || "—"}</p>
                            <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5 truncate px-2">{profile?.email}</p>
                            {profile?.bio && <p className="text-gray-400 dark:text-slate-500 text-xs mt-2 leading-relaxed line-clamp-2">{profile.bio}</p>}

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800/50 grid grid-cols-2 gap-2">
                                {[
                                    { label: "Transactions", value: profile?.stats?.totalTransactions ?? 0, icon: Activity },
                                    { label: "Goals", value: profile?.stats?.totalGoals ?? 0, icon: Target },
                                ].map((s) => (
                                    <div key={s.label} className="bg-gray-100/60 dark:bg-slate-800/40 rounded-xl p-2.5 text-center">
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{s.value}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {profile?.createdAt && (
                                <p className="text-xs text-gray-400 dark:text-slate-600 mt-3">
                                    Member since <span className="text-gray-400 dark:text-slate-500">{new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                                </p>
                            )}
                        </motion.div>

                        <motion.nav
                            whileHover={{ scale: 1.008, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/90 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = tab === item.id;
                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={item.id} onClick={() => setTab(item.id)}
                                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all border-b border-gray-200/80 dark:border-slate-800/40 last:border-0
                                            ${active
                                                ? "bg-violet-500/10 text-violet-500 dark:text-violet-300 border-l-2 border-l-violet-500"
                                                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100/60 dark:hover:bg-slate-800/40 border-l-2 border-l-transparent"
                                            }`}>
                                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600 dark:text-violet-400" : ""}`} />
                                        {item.label}
                                    </motion.button>
                                );
                            })}
                        </motion.nav>

                        <motion.div
                            whileHover={{ scale: 1.008, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                            transition={{ duration: 0.2 }}
                            className={`rounded-2xl p-4 border ${profile?.twoFactorEnabled ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/30" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/30"}`}>
                            <div className="flex items-center gap-2.5">
                                <Shield className={`w-4 h-4 ${profile?.twoFactorEnabled ? "text-emerald-400" : "text-amber-400"}`} />
                                <div>
                                    <p className={`text-xs font-semibold ${profile?.twoFactorEnabled ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                                        {profile?.twoFactorEnabled ? "Account Secured" : "Improve Security"}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                        {profile?.twoFactorEnabled ? "2FA is enabled" : "Enable 2FA for extra protection"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.aside>

                    <motion.main
                        className="flex-1 min-w-0 space-y-5"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}>

                        <AnimatePresence mode="wait">
                            {tab === "personal" && (
                                <motion.div
                                    key="personal"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5">
                                    <Card title="Personal Information" subtitle="Your name, contact details, and profile photo" icon={User}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field label="Full Name" required>
                                                <TextInput value={name} onChange={setName} placeholder="John Doe" icon={User} />
                                            </Field>
                                            <Field label="Email Address">
                                                <TextInput value={profile?.email || ""} icon={Mail} disabled />
                                            </Field>
                                            <Field label="Phone Number">
                                                <TextInput value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" icon={Phone} />
                                            </Field>
                                            <Field label="Avatar URL">
                                                <TextInput value={avatar} onChange={setAvatar} placeholder="https://…" icon={Camera} />
                                            </Field>
                                            <div className="sm:col-span-2">
                                                <Field label="Short Bio">
                                                    <textarea
                                                        value={bio} onChange={(e) => setBio(e.target.value)}
                                                        placeholder="A brief description about yourself…"
                                                        rows={3}
                                                        className="w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 px-4 py-2.5 resize-none transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70"
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                        <SaveRow onSave={savePersonal} saving={saving} note="Email address cannot be changed after registration." />
                                    </Card>

                                    <Card title="Account Overview" icon={BarChart3}>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { label: "Status", value: "Active", valueClass: "text-emerald-400", dot: true },
                                                { label: "2FA", value: profile?.twoFactorEnabled ? "Enabled" : "Disabled", valueClass: profile?.twoFactorEnabled ? "text-emerald-400" : "text-amber-400" },
                                                { label: "Joined", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—", valueClass: "text-gray-600 dark:text-slate-300" },
                                                { label: "Last Login", value: profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : "—", valueClass: "text-gray-600 dark:text-slate-300" },
                                            ].map((item) => (
                                                <div key={item.label} className="bg-gray-100/60 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/40 rounded-xl p-3.5">
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{item.label}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                        <span className={`text-sm font-semibold ${item.valueClass}`}>{item.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {tab === "financial" && (
                            <motion.div key="financial" className="space-y-5"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                                <Card title="Financial Preferences" subtitle="Currency, date format, and display settings" icon={DollarSign}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Default Currency">
                                            <SelectInput value={currency} onChange={setCurrency} options={CURRENCIES} icon={DollarSign} />
                                        </Field>
                                        <Field label="Date Format">
                                            <SelectInput value={dateFormat} onChange={setDateFormat} options={DATE_FORMATS} icon={FileText} />
                                        </Field>
                                        <Field label="Timezone">
                                            <SelectInput value={timezone} onChange={setTimezone} options={TIMEZONES} icon={Clock} />
                                        </Field>
                                        <Field label="Language">
                                            <SelectInput value={language} onChange={setLanguage} options={LANGUAGES} icon={Globe} />
                                        </Field>
                                    </div>
                                    <SaveRow onSave={saveFinancial} saving={saving} note="Currency changes affect all transaction displays across the app." />
                                </Card>

                                <Card title="Budget & Savings Goals" subtitle="Set your monthly targets for better financial planning" icon={Target}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Monthly Budget Limit">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm font-medium">
                                                    {CURRENCIES.find((c) => c.value === currency)?.symbol || "$"}
                                                </span>
                                                <input
                                                    type="number" min="0" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)}
                                                    placeholder="5000"
                                                    className="w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 pl-8 pr-4 py-2.5 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70"
                                                />
                                            </div>
                                        </Field>
                                        <Field label="Monthly Savings Target (%)">
                                            <div className="relative">
                                                <input
                                                    type="number" min="0" max="100" value={savingsGoalPercent}
                                                    onChange={(e) => setSavingsGoalPercent(e.target.value)}
                                                    placeholder="20"
                                                    className="w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 px-4 pr-9 py-2.5 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 hover:border-gray-300 dark:hover:border-slate-600/70"
                                                />
                                                <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="mt-4 p-4 bg-gray-100/50 dark:bg-slate-800/30 border border-gray-200/60 dark:border-slate-700/30 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500 dark:text-slate-400">Savings Target</span>
                                            <span className="text-xs font-semibold text-violet-400">{savingsGoalPercent}% of income</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(Number(savingsGoalPercent), 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                                            The 50/30/20 rule recommends saving at least 20% of your monthly income.
                                        </p>
                                    </div>

                                    <SaveRow onSave={saveFinancial} saving={saving} />
                                </Card>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {tab === "security" && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5">
                                    <Card title="Change Password" subtitle="Use a strong, unique password for this account" icon={Lock}>
                                        <div className="space-y-4">
                                            {[
                                                { label: "Current Password", value: curPw, set: setCurPw, show: showCur, toggle: () => setShowCur(!showCur) },
                                                { label: "New Password", value: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) },
                                                { label: "Confirm Password", value: confPw, set: setConfPw, show: showConf, toggle: () => setShowConf(!showConf), confirm: true },
                                            ].map(({ label, value, set, show: showPw, toggle, confirm }) => (
                                                <Field key={label} label={label} required>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                        <input
                                                            type={showPw ? "text" : "password"} value={value}
                                                            onChange={(e) => set(e.target.value)}
                                                            placeholder={label === "New Password" ? "Min. 8 characters" : "Enter password"}
                                                            className={`w-full bg-gray-100/60 dark:bg-slate-800/50 border rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 pl-10 pr-10 py-2.5 transition-all focus:outline-none hover:border-gray-300 dark:hover:border-slate-600/70
                                                            ${confirm && confPw
                                                                    ? newPw === confPw ? "border-emerald-500/50 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20" : "border-red-500/50 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20"
                                                                    : "border-gray-200 dark:border-slate-700/50 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
                                                                }`}
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                            {confirm && confPw && (
                                                                newPw === confPw
                                                                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                    : <X className="w-3.5 h-3.5 text-red-400" />
                                                            )}
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                type="button" onClick={toggle} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition-colors cursor-pointer">
                                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                    {label === "New Password" && newPw && (
                                                        <div className="mt-2 space-y-1">
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map((i) => (
                                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : "bg-gray-200 dark:bg-slate-700"}`} />
                                                                ))}
                                                            </div>
                                                            <p className={`text-xs font-medium ${strength.level <= 1 ? "text-red-400" : strength.level <= 3 ? "text-amber-400" : "text-emerald-400"}`}>
                                                                {strength.label}
                                                            </p>
                                                        </div>
                                                    )}
                                                </Field>
                                            ))}
                                        </div>
                                        <div className="mt-6 flex justify-end pt-5 border-t border-gray-200 dark:border-slate-800/50">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={changePassword} disabled={saving}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 cursor-pointer">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                                Update Password
                                            </motion.button>
                                        </div>
                                    </Card>

                                    <Card title="Two-Factor Authentication" subtitle="Add a second layer of protection to your account" icon={Smartphone}>                                      
                                        <TwoFactorSetup
                                            enabled={profile?.twoFactorEnabled ?? false}
                                            onUpdate={fetchProfile}
                                            showToast={show}
                                        />
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {tab === "notifications" && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}>
                                    <Card title="Notification Preferences" subtitle="Control how and when GetMoneyPlanner contacts you" icon={Bell}>
                                        <NotifRow icon={Mail} title="Email Alerts" desc="Critical alerts and account notifications via email" enabled={notif.emailAlerts} onChange={(v) => setNotif((p) => ({ ...p, emailAlerts: v }))} />
                                        <NotifRow icon={Bell} title="Push Notifications" desc="Real-time browser push notifications" enabled={notif.pushAlerts} onChange={(v) => setNotif((p) => ({ ...p, pushAlerts: v }))} />
                                        <NotifRow icon={DollarSign} title="Transaction Alerts" desc="Notify me when a transaction is added, edited, or deleted" enabled={notif.transactionAlerts} onChange={(v) => setNotif((p) => ({ ...p, transactionAlerts: v }))} />
                                        <NotifRow icon={AlertCircle} title="Budget Alerts" desc="Warn me when I am approaching or exceeding my monthly budget" enabled={notif.budgetAlerts} onChange={(v) => setNotif((p) => ({ ...p, budgetAlerts: v }))} />
                                        <NotifRow icon={Target} title="Goal Progress Alerts" desc="Notify me on savings goal milestones and completions" enabled={notif.goalAlerts} onChange={(v) => setNotif((p) => ({ ...p, goalAlerts: v }))} />
                                        <NotifRow icon={AlertTriangle} title="Unusual Activity" desc="Alert me about suspicious or unusual account activity" enabled={notif.unusualActivity} onChange={(v) => setNotif((p) => ({ ...p, unusualActivity: v }))} />
                                        <NotifRow icon={BarChart3} title="Weekly Summary" desc="A brief financial summary every Monday morning" enabled={notif.weeklyReport} onChange={(v) => setNotif((p) => ({ ...p, weeklyReport: v }))} />
                                        <NotifRow icon={TrendingUp} title="Monthly Report" desc="Detailed monthly financial report on the 1st of each month" enabled={notif.monthlyReport} onChange={(v) => setNotif((p) => ({ ...p, monthlyReport: v }))} />
                                        <div className="mt-5 flex justify-end pt-5 border-t border-gray-200 dark:border-slate-800/50">
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                whileHover={{ scale: 1.02 }} onClick={saveNotifications} disabled={saving}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 cursor-pointer">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Save Preferences
                                            </motion.button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {tab === "privacy" && (
                                <motion.div
                                    key="privacy"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5">
                                    <Card title="Privacy Settings" subtitle="Control how your data is used within the platform" icon={Lock}>
                                        <PrivacyRow
                                            title="Public Profile" desc="Allow other users in your organization to see your profile information."
                                            enabled={privacy.profileVisible} onChange={(v) => setPrivacy((p) => ({ ...p, profileVisible: v }))}
                                        />
                                        <PrivacyRow
                                            title="Data Sharing" desc="Share anonymized usage data to help improve app features and recommendations."
                                            badge="Optional"
                                            enabled={privacy.dataSharing} onChange={(v) => setPrivacy((p) => ({ ...p, dataSharing: v }))}
                                        />
                                        <PrivacyRow
                                            title="Analytics & Insights" desc="Allow collection of usage analytics to personalize your financial insights."
                                            enabled={privacy.analyticsOptIn} onChange={(v) => setPrivacy((p) => ({ ...p, analyticsOptIn: v }))}
                                        />
                                        <div className="mt-5 flex justify-end pt-5 border-t border-gray-200 dark:border-slate-800/50">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }} onClick={savePrivacy} disabled={saving}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 cursor-pointer">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Save Settings
                                            </motion.button>
                                        </div>
                                    </Card>

                                    <Card title="Your Data" subtitle="Download or delete all your personal data" icon={Download}>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-gray-100/50 dark:bg-slate-800/30 border border-gray-200/60 dark:border-slate-700/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center">
                                                        <Download className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Export My Data</p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500">Download all your transactions, goals, and settings as JSON</p>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }} onClick={exportData} disabled={exportLoading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-600/30 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer">
                                                    {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                    Export
                                                </motion.button>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl overflow-hidden">
                                        <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/30 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Danger Zone</h3>
                                                <p className="text-xs text-red-500 dark:text-red-500/70 mt-0.5">Irreversible actions — proceed with caution</p>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Delete Account</p>
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 max-w-sm leading-relaxed">
                                                        Permanently delete your account and all associated data. This cannot be undone.
                                                    </p>
                                                </div>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteModal(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-500 dark:text-red-400 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Delete Account
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {tab === "sessions" && (
                                <motion.div
                                    key="sessions"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}>
                                    <Card
                                        title="Active Sessions"
                                        subtitle="Devices with active login sessions — revoke any you don't recognise"
                                        icon={Monitor}>

                                        {profile?.sessions && profile.sessions.length > 0 ? (() => {
                                            const now = new Date();
                                            const enriched = profile.sessions.map((s) => ({
                                                ...s,
                                                isActive: s.expiresAt ? new Date(s.expiresAt) > now : false,
                                            }));
                                            const activeSessions = enriched.filter((s) => s.isActive);
                                            const expiredSessions = enriched.filter((s) => !s.isActive);

                                            const SessionCard = ({ s, isActive }: { s: typeof enriched[0]; isActive: boolean }) => (
                                                <div className={`p-4 rounded-xl border ${isActive
                                                    ? "bg-violet-50 dark:bg-violet-500/5 border-violet-200 dark:border-violet-500/20"
                                                    : "bg-gray-50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700/30"}`}>

                                                    <div className="hidden sm:flex items-start gap-3">
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isActive
                                                            ? "bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
                                                            : "bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"}`}>
                                                            <Monitor className={`w-4 h-4 ${isActive ? "text-violet-500 dark:text-violet-400" : "text-gray-400 dark:text-slate-500"}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className={`text-sm font-semibold ${isActive ? "text-gray-800 dark:text-slate-200" : "text-gray-600 dark:text-slate-400"}`}>
                                                                        {s.device}
                                                                    </p>
                                                                    {isActive ? (
                                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                            Active
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 font-medium shrink-0">
                                                                            Expired
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                                    <span>{s.location}</span>
                                                                    <span className="text-gray-300 dark:text-slate-600">·</span>
                                                                    <span>{new Date(s.lastActive).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                            {!isActive && (
                                                                <motion.button
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => revokeSession(s.id)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700/50 text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer whitespace-nowrap">
                                                                    <LogOut className="w-3 h-3 shrink-0" />
                                                                    Revoke
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="sm:hidden flex gap-3">
                                                        <div className="flex items-center">
                                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive
                                                                ? "bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
                                                                : "bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"}`}>
                                                                <Monitor className={`w-4 h-4 ${isActive ? "text-violet-500 dark:text-violet-400" : "text-gray-400 dark:text-slate-500"}`} />
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold ${isActive ? "text-gray-800 dark:text-slate-200" : "text-gray-600 dark:text-slate-400"}`}>
                                                                {s.device}
                                                            </p>

                                                            <div className="flex items-center justify-between mt-1">
                                                                {isActive ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-medium">
                                                                        Expired
                                                                    </span>
                                                                )}
                                                                {!isActive && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => revokeSession(s.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700/50 text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap">
                                                                        <LogOut className="w-3 h-3 shrink-0" />
                                                                        Revoke
                                                                    </motion.button>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                                                                <MapPin className="w-3 h-3 shrink-0" />
                                                                <span>{s.location}</span>
                                                                <span className="text-gray-300 dark:text-slate-600">·</span>
                                                                <span>{new Date(s.lastActive).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div className="space-y-2">
                                                    {activeSessions.length > 0 && (
                                                        <>
                                                            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider pb-1">
                                                                Active ({activeSessions.length})
                                                            </p>
                                                            <div className="space-y-2">
                                                                {activeSessions.map((s) => <SessionCard key={s.id} s={s} isActive={true} />)}
                                                            </div>
                                                        </>
                                                    )}

                                                    {expiredSessions.length > 0 && (
                                                        <>
                                                            {activeSessions.length > 0 && <div className="h-3" />}
                                                            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider pb-1">
                                                                Expired Sessions ({expiredSessions.length})
                                                            </p>
                                                            <div className="space-y-2">
                                                                {expiredSessions.map((s) => <SessionCard key={s.id} s={s} isActive={false} />)}
                                                            </div>
                                                        </>
                                                    )}

                                                    {activeSessions.length === 0 && expiredSessions.length === 0 && (
                                                        <div className="text-center py-8">
                                                            <Monitor className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                                            <p className="text-sm text-gray-400 dark:text-slate-500">No sessions found</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })() : (
                                            <div className="text-center py-10">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/40 flex items-center justify-center mx-auto mb-3">
                                                    <Monitor className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No sessions found</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Login history will appear here</p>
                                            </div>
                                        )}

                                        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-slate-800/50 flex items-center justify-between gap-4">
                                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                                Sessions expire after 7 days of inactivity.
                                            </p>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={revokeAllOthers}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer shrink-0">
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Revoke All Others
                                            </motion.button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.main>
                </motion.div>
            </div>

            <style jsx global>{`
                @keyframes toast-in {
                from { opacity: 0; transform: translateX(1.5rem) scale(0.95); }
                to   { opacity: 1; transform: translateX(0) scale(1); }
                }
                .animate-toast-in { animation: toast-in 0.22s cubic-bezier(.16,1,.3,1) both; }
            `}</style>
        </motion.div>
    );
}