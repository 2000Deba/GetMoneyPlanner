"use client";

import React from "react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const container = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Gift",
  "Bonus",
  "Utilities",
  "Insurance",
  "Other Income",
  "Other Expense",
];

const NOTE_MAX = 500;

function AddTransactionForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [form, setForm] = useState({
    type: "",
    amount: "",
    category: "",
    note: "",
    date: today,
  });

  const noteLen = form.note.length;
  const noteNearLimit = noteLen > 450;
  const noteBeforeLimit = noteLen >= 490;
  const noteAtLimit = noteLen >= NOTE_MAX;

  const inputClass =
    "w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400";

  function validateForm() {
    const amount = Number(form.amount);

    if (!form.type) {
      toast.error("Please select transaction type");
      return false;
    }

    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return false;
    }

    if (amount > 10000000) {
      toast.error("Amount is too large");
      return false;
    }

    if (!form.category.trim()) {
      toast.error("Category is required");
      return false;
    }

    if (!form.date) {
      toast.error("Date is required");
      return false;
    }

    if (new Date(form.date) > new Date()) {
      toast.error("Date cannot be in the future");
      return false;
    }

    if (noteLen > NOTE_MAX) {
      toast.error(`Note cannot exceed ${NOTE_MAX} characters`);
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        type: form.type,
        amount: Number(form.amount),
        category: form.category.trim(),
        note: form.note.trim().slice(0, NOTE_MAX),
        date: form.date,
      };

      console.log("📤 Sending transaction:", payload);

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("📥 Response:", data);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Something went wrong");
      }

      toast.success("Transaction added successfully 🎉");

      setForm({
        type: "",
        amount: "",
        category: "",
        note: "",
        date: today,
      });

      onSuccess();
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      toast.error("Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      variants={container}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="relative w-full bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-xl p-4 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 md:p-6 space-y-4">
      <motion.h2 variants={item} className="text-lg font-semibold">
        Add Transaction
      </motion.h2>

      <motion.div variants={item} className="grid grid-cols-2 gap-4">
        <select
          aria-label="Transaction type"
          className={inputClass}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })} required>
          <option value="">Select type</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          aria-label="Amount"
          type="number"
          placeholder="Amount"
          min="1"
          className={inputClass}
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          onWheel={(e) => e.currentTarget.blur()}
          required
        />
      </motion.div>

      <motion.select
        variants={item}
        aria-label="Category"
        className={inputClass}
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        required>
        <option value="">Select category</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </motion.select>

      <motion.input
        variants={item}
        aria-label="Date"
        type="date"
        className={inputClass}
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />

      <motion.div variants={item} className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">Note (optional)</span>
          <span className={`text-xs font-medium tabular-nums transition-colors ${noteBeforeLimit ? "text-red-500" :
            noteNearLimit ? "text-amber-500" :
              "text-gray-400 dark:text-gray-500"
            }`}>
            {noteLen}/{NOTE_MAX}
          </span>
        </div>
        <textarea
          rows={3}
          placeholder="Note (optional)"
          className={`${inputClass} resize-none transition-colors ${noteAtLimit ? "border-red-400 focus:ring-red-400" : ""
            }`}
          value={form.note}
          onChange={(e) => {
            if (e.target.value.length <= NOTE_MAX) {
              setForm({ ...form, note: e.target.value })
            }
          }}
        />
        {noteAtLimit && (
          <p className="text-xs text-red-500">Maximum {NOTE_MAX} characters reached</p>
        )}
      </motion.div>

      <motion.button
        variants={item}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={submitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed">
        {submitting ? "Adding..." : "Add Transaction"}
      </motion.button>
    </motion.form>
  );
}
export default React.memo(AddTransactionForm);