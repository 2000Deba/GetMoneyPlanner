"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ScrollText, ChevronRight, CheckCircle2, XCircle,
  AlertTriangle, Scale, RefreshCw, Mail, ShieldCheck, CreditCard,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const sections = [
  {
    id: "acceptance",
    icon: CheckCircle2,
    title: "Acceptance of Terms",
    accent: "#8b5cf6",
    content: `By creating an account or using GetMoneyPlanner in any way, you confirm that you are at least 13 years of age (or the minimum age of digital consent in your jurisdiction), have read and understood these Terms, and agree to be bound by them.

If you are using GetMoneyPlanner on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.

If you do not agree with any part of these Terms, please do not use the service.`,
  },
  {
    id: "service-description",
    icon: CheckCircle2,
    title: "Description of Service",
    accent: "#6366f1",
    content: `GetMoneyPlanner is a personal finance management platform that allows users to track income and expenses, set and monitor financial goals, view spending analytics, and receive automated financial summaries.

The service is provided "as is" and "as available". We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice, though we will make reasonable efforts to notify users of significant changes.`,
  },
  {
    id: "account",
    icon: ShieldCheck,
    title: "Your Account",
    accent: "#3b82f6",
    content: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

You agree to: (a) provide accurate and current information when registering; (b) notify us immediately of any unauthorised use of your account; (c) not share your account credentials with others.

We recommend enabling two-factor authentication, which is available in your Profile settings. We are not liable for losses arising from unauthorised access due to your failure to secure your credentials.`,
  },
  {
    id: "acceptable-use",
    icon: XCircle,
    title: "Acceptable Use",
    accent: "#06b6d4",
    content: `You agree not to use GetMoneyPlanner to:

- Engage in any illegal activity or violate any applicable law or regulation
- Attempt to gain unauthorised access to any part of the service or other users' data
- Reverse engineer, decompile, or attempt to extract the source code of the application
- Upload malware, viruses, or any code designed to disrupt or damage the service
- Use automated scripts to access the service in a way that imposes unreasonable load on our infrastructure
- Impersonate any person or entity or misrepresent your affiliation with any person or entity

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: "financial-disclaimer",
    icon: AlertTriangle,
    title: "Financial Information Disclaimer",
    accent: "#f59e0b",
    content: `GetMoneyPlanner is a personal finance tracking tool — it is not a financial advisor, investment advisor, tax advisor, or broker.

Nothing on GetMoneyPlanner constitutes financial, investment, tax, or legal advice. The budgets, projections, and insights shown are based solely on the data you enter and are for informational and planning purposes only.

You should consult a qualified financial professional before making any significant financial decisions. We are not liable for any financial decisions made based on information displayed in the application.`,
  },
  {
    id: "data-ownership",
    icon: CreditCard,
    title: "Data Ownership & Intellectual Property",
    accent: "#10b981",
    content: `Your Data: All financial data, transaction records, and personal information you enter remains yours. You retain full ownership of your data. We do not claim any intellectual property rights over it.

Our Platform: The GetMoneyPlanner application, including its design, codebase, features, and branding, is the intellectual property of GetMoneyPlanner and is protected by applicable copyright and trademark laws. You may not copy, reproduce, or create derivative works from the platform without express written permission.

Feedback: If you submit feedback, suggestions, or bug reports, you grant us a non-exclusive, royalty-free licence to incorporate that feedback into the service without any obligation to you.`,
  },
  {
    id: "limitation",
    icon: Scale,
    title: "Limitation of Liability",
    accent: "#ef4444",
    content: `To the maximum extent permitted by applicable law, GetMoneyPlanner and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including but not limited to loss of data, loss of profits, or financial decisions made based on data displayed in the application.

Our total liability for any claim arising out of or relating to these Terms or the service shall not exceed the amount you paid us in the 12 months preceding the claim (or £10 if you have paid nothing).

Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the above may not apply to you.`,
  },
  {
    id: "termination",
    icon: XCircle,
    title: "Termination",
    accent: "#ec4899",
    content: `You may delete your account at any time from Profile → Security → Delete Account. Upon deletion, your data will be permanently removed from our systems within 30 days.

We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or if we are required to do so by law. We will make reasonable efforts to notify you before taking such action.

Upon termination, your right to use the service ceases immediately. Provisions of these Terms that by their nature should survive termination (including disclaimers, limitations of liability, and dispute resolution) shall survive.`,
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "Changes to These Terms",
    accent: "#84cc16",
    content: `We may update these Terms from time to time to reflect changes in the service, applicable law, or our practices. When we make material changes, we will notify you by email and/or via an in-app notice at least 14 days before the changes take effect.

Your continued use of the service after the effective date of updated Terms constitutes your acceptance of the new Terms. If you do not agree to the updated Terms, you should delete your account before they take effect.`,
  },
  {
    id: "contact-legal",
    icon: Mail,
    title: "Governing Law & Contact",
    accent: "#f97316",
    content: `These Terms are governed by and construed in accordance with applicable law. Any disputes arising out of or relating to these Terms or the service shall be resolved through good-faith negotiation in the first instance.

If you have any questions about these Terms, please contact us via the Contact page. We aim to respond to all enquiries within 5 business days.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/4 dark:bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-violet-600/3 dark:bg-violet-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        <motion.nav
          variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 mb-8">
          <Link href="/" className="hover:text-violet-500 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 dark:text-slate-300 font-medium">Terms of Service</span>
        </motion.nav>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <ScrollText className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                Terms of Service
              </h1>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                Last updated: May 2026
              </p>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
              Please read these Terms of Service carefully before using{" "}
              <strong className="text-indigo-600 dark:text-indigo-400">GetMoneyPlanner</strong>.
              These Terms govern your access to and use of the service. By using GetMoneyPlanner,
              you agree to these Terms.
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
                  <Icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200 transition-colors">
                    {i + 1}. {s.title}
                  </span>
                </a>
              );
            })}
          </div>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, si) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.id}
                id={section.id}
                variants={fadeUp} custom={si + 3} initial="hidden" animate="visible"
                className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm scroll-mt-6">
                <div className="h-1" style={{ backgroundColor: section.accent }} />
                <div className="p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${section.accent}18`, border: `1px solid ${section.accent}30` }}>
                      <Icon className="w-4 h-4" style={{ color: section.accent }} />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>

        <motion.div variants={fadeUp} custom={sections.length + 4} initial="hidden" animate="visible"
          className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Questions about our Terms?
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/20">
              <Mail className="w-4 h-4" /> Contact Us
            </Link>
            <Link href="/privacy"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
              Privacy Policy
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}