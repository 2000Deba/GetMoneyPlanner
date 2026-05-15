"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, ChevronRight, Lock, Eye, Database, Bell, UserCheck, Trash2, Mail, Globe } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const sections = [
  {
    id: "information-we-collect",
    icon: Database,
    title: "Information We Collect",
    accent: "#8b5cf6",
    content: [
      {
        subtitle: "Account Information",
        text: "When you register, we collect your name, email address, and a securely hashed password. If you sign in via Google or GitHub OAuth, we receive only the basic profile information those providers share (name, email, profile picture).",
      },
      {
        subtitle: "Financial Data",
        text: "All transaction records, financial goals, budget settings, and related data you enter are stored securely in your account. This data is used solely to provide you with the GetMoneyPlanner service and is never sold or shared with third parties for marketing.",
      },
      {
        subtitle: "Device & Session Data",
        text: "We collect device type, browser name, approximate location (derived from IP address), and session timestamps to power the Active Sessions feature and detect unusual login activity. Raw IP addresses are not stored permanently.",
      },
      {
        subtitle: "Usage Data",
        text: "We may collect anonymised, aggregated usage statistics (pages visited, features used) to improve the product. This data cannot be used to identify individual users.",
      },
    ],
  },
  {
    id: "how-we-use",
    icon: Eye,
    title: "How We Use Your Information",
    accent: "#6366f1",
    content: [
      {
        subtitle: "Providing the Service",
        text: "Your data is used to operate GetMoneyPlanner — displaying your dashboard, syncing transactions with goals, generating reports, and sending notification emails you have opted into.",
      },
      {
        subtitle: "Security & Fraud Prevention",
        text: "Session data and login timestamps are used to detect unusual activity and alert you when a new device signs into your account.",
      },
      {
        subtitle: "Product Improvement",
        text: "Anonymised analytics help us understand which features are most useful and where we can improve the experience. Individual financial data is never used for this purpose.",
      },
      {
        subtitle: "Communications",
        text: "We send transactional emails such as goal achievement notifications, unusual activity alerts, and (if opted in) weekly or monthly financial summaries. We do not send unsolicited marketing emails.",
      },
    ],
  },
  {
    id: "data-security",
    icon: Lock,
    title: "Data Security",
    accent: "#3b82f6",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is transmitted over HTTPS/TLS. Passwords are hashed using bcrypt with a high work factor and are never stored in plain text. Two-factor authentication (TOTP) is available and recommended.",
      },
      {
        subtitle: "Database Security",
        text: "Financial data is stored in MongoDB Atlas with access controls, IP allowlisting, and encryption at rest. Database credentials are never exposed in client-side code.",
      },
      {
        subtitle: "Session Management",
        text: "Sessions expire automatically after 7 days of inactivity. You can view and revoke any active session from your Profile page at any time.",
      },
    ],
  },
  {
    id: "data-sharing",
    icon: Globe,
    title: "Data Sharing & Third Parties",
    accent: "#06b6d4",
    content: [
      {
        subtitle: "We Do Not Sell Your Data",
        text: "GetMoneyPlanner does not sell, rent, or trade your personal or financial information to any third party, ever.",
      },
      {
        subtitle: "Service Providers",
        text: "We use a limited number of trusted third-party services to operate the platform: MongoDB Atlas (database), Vercel (hosting), and email delivery providers. These processors handle data solely on our behalf under strict data processing agreements.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required by law, court order, or to protect the rights and safety of our users or the public.",
      },
    ],
  },
  {
    id: "your-rights",
    icon: UserCheck,
    title: "Your Rights & Choices",
    accent: "#10b981",
    content: [
      {
        subtitle: "Access & Export",
        text: "You can export all your personal and financial data at any time from Profile → Security → Export My Data. The export includes your profile, all transactions, and goal history in JSON format.",
      },
      {
        subtitle: "Correction",
        text: "You can update your personal information, notification preferences, and privacy settings directly from your Profile page.",
      },
      {
        subtitle: "Deletion",
        text: "You can permanently delete your account and all associated data from Profile → Security → Delete Account. Deletion is irreversible and removes all your data from our systems within 30 days.",
      },
      {
        subtitle: "Notification Preferences",
        text: "You can opt out of any category of email notification (goal alerts, weekly reports, unusual activity alerts) from Profile → Notifications at any time.",
      },
    ],
  },
  {
    id: "cookies",
    icon: Bell,
    title: "Cookies & Local Storage",
    accent: "#f59e0b",
    content: [
      {
        subtitle: "Session Cookies",
        text: "We use secure, HTTP-only cookies to maintain your login session via NextAuth.js. These are strictly necessary for the service to function and cannot be disabled.",
      },
      {
        subtitle: "Preference Storage",
        text: "Your UI preferences such as dark/light mode may be stored in your browser's local storage. This data never leaves your device.",
      },
      {
        subtitle: "No Tracking Cookies",
        text: "We do not use third-party advertising or tracking cookies. We do not participate in cross-site user tracking.",
      },
    ],
  },
  {
    id: "data-retention",
    icon: Trash2,
    title: "Data Retention",
    accent: "#ef4444",
    content: [
      {
        subtitle: "Active Accounts",
        text: "We retain your data for as long as your account is active. Session records older than 7 days are automatically expired.",
      },
      {
        subtitle: "Deleted Accounts",
        text: "When you delete your account, all personal data, transactions, and goals are permanently removed from our production database within 30 days. Anonymised, aggregated statistics may be retained.",
      },
      {
        subtitle: "Backups",
        text: "Encrypted database backups are retained for up to 30 days for disaster recovery. Your data will be purged from backups within this window following account deletion.",
      },
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Contact & Updates",
    accent: "#ec4899",
    content: [
      {
        subtitle: "Questions",
        text: "If you have any questions about this Privacy Policy or how your data is handled, please contact us through the Contact page or at the email address listed there.",
      },
      {
        subtitle: "Policy Updates",
        text: "We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or via an in-app notice. The 'Last updated' date at the top of this page will always reflect the most recent revision.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-600/4 dark:bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-indigo-600/3 dark:bg-indigo-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        <motion.nav
          variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 mb-8">
          <Link href="/" className="hover:text-violet-500 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 dark:text-slate-300 font-medium">Privacy Policy</span>
        </motion.nav>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                Last updated: May 2026
              </p>
            </div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-500/8 border border-violet-200 dark:border-violet-500/20 rounded-2xl p-5">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
              At <strong className="text-violet-600 dark:text-violet-400">GetMoneyPlanner</strong>, your privacy is foundational — not an afterthought.
              This policy explains exactly what data we collect, why we collect it, how we protect it,
              and what control you have over it. We believe you should be able to manage your finances
              without sacrificing your privacy.
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
          className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl p-6 mb-10 backdrop-blur-sm">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={s.id} href={`#${s.id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                  <Icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-slate-500 group-hover:text-violet-500 transition-colors" />
                  <span className="text-sm text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200 transition-colors">
                    {i + 1}. {s.title}
                  </span>
                </a>
              );
            })}
          </div>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, si) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.id}
                id={section.id}
                variants={fadeUp} custom={si + 3} initial="hidden" animate="visible"
                className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm scroll-mt-6">
                {/* accent strip */}
                <div className="h-1" style={{ backgroundColor: section.accent }} />
                <div className="p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${section.accent}18`, border: `1px solid ${section.accent}30` }}>
                      <Icon className="w-5 h-5" style={{ color: section.accent }} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                  </div>
                  <div className="space-y-5">
                    {section.content.map((item, ii) => (
                      <div key={ii}>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1.5"
                          style={{ color: section.accent }}>{item.subtitle}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>

        <motion.div variants={fadeUp} custom={sections.length + 4} initial="hidden" animate="visible"
          className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Have a question about your data?
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/20">
              <Mail className="w-4 h-4" /> Contact Us
            </Link>
            <Link href="/terms"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}