"use client";

import React from "react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";

type SummaryCardProps = {
  title: string;
  amount: number;
  type?: "income" | "expense" | "balance";
  loading?: boolean;
};

function SummaryCard({
  title,
  amount,
  type = "balance",
  loading = false,
}: SummaryCardProps) {

  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    if (loading) return;

    let start = 0;
    const end = amount;
    const duration = 1200;
    const step = Math.max(Math.abs(end) / 60, 1);

    const timer = setInterval(() => {
      start += step * (end < 0 ? -1 : 1);

      if ((end >= 0 && start >= end) || (end < 0 && start <= end)) {
        start = end;
        clearInterval(timer);
      }

      setDisplayAmount(Math.round(start));
    }, duration / 60);

    return () => clearInterval(timer);
  }, [amount, loading]);

  const formattedAmount = useMemo(
    () => displayAmount.toLocaleString("en-IN"),
    [displayAmount]
  );

  const theme = {
    income: {
      text: "text-green-600 dark:text-green-500",
      border: "from-green-400 to-green-600",
      icon: <ArrowUpRight size={20} />,
    },
    expense: {
      text: "text-red-600 dark:text-red-500",
      border: "from-red-400 to-red-600",
      icon: <ArrowDownRight size={20} />,
    },
    balance: {
      text:
        amount < 0
          ? "text-red-600 dark:text-red-500"
          : "text-blue-600 dark:text-blue-500",
      border:
        amount < 0
          ? "from-red-400 to-red-600"
          : "from-blue-400 to-blue-600",
      icon: <Scale size={20} />,
    },
  };

  const current = theme[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label={`${title} summary`}
      className="relative rounded-xl p-[1.5px] bg-gradient-to-br shadow-lg"
      style={{
        backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
      }}>
      <div
        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${current.border} opacity-70`}
      />

      <div className="relative bg-white/80 dark:bg-gray-900/70 rounded-xl p-4 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40">
        {/* Skeleton Loading */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-7 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {title}
              </p>
              <span
                className={`p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 ${current.text}`}>
                {current.icon}
              </span>
            </div>
            <p className={`mt-1 font-bold ${current.text} 
              text-xl sm:text-2xl md:text-2xl lg:text-3xl text-center`}>
              ₹{formattedAmount}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
export default React.memo(SummaryCard);