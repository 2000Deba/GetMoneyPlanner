"use client";

import React from "react";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

const COLORS = ["#22c55e", "#ef4444"];

function TransactionDonut({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(
    () => [
      { name: "Income", value: Math.abs(income) },
      { name: "Expense", value: Math.abs(expense) },
    ],
    [income, expense]
  );

  const total = Math.abs(income) + Math.abs(expense);
  const balance = income - expense;

  const incomePercent = total > 0 ? ((Math.abs(income) / total) * 100).toFixed(1) : "0";
  const expensePercent = total > 0 ? ((Math.abs(expense) / total) * 100).toFixed(1) : "0";

  const formattedIncome = useMemo(() => income.toLocaleString(), [income]);
  const formattedExpense = useMemo(() => expense.toLocaleString(), [expense]);
  const formattedBalance = useMemo(() => balance.toLocaleString(), [balance]);

  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const safeData = total === 0
    ? [{ name: "No Data", value: 1 }]
    : data;

  const COLORS_SAFE =
    total === 0 ? ["#9ca3af"] : COLORS;
  const getColor = (index: number) =>
    COLORS_SAFE[index] || "#9ca3af";

  if (!isMounted) {
    return (
      <div className="w-full bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-xl p-4 border border-gray-200/40 dark:border-gray-700/40 md:p-6">

        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />

        <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>

      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-xl p-4 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 md:p-6">
      <h3 className="text-sm md:text-base font-semibold mb-3 text-gray-700 dark:text-gray-200">
        Income vs Expense
      </h3>

      <div className="relative w-full min-h-56 h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              aria-label="Income vs Expense chart"
              data={safeData}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={total !== 0}
              activeShape={(props: PieSectorDataItem) => {
                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index, } = props as any;

                const isActive = index === activeIndex;

                return (
                  <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={isActive ? outerRadius + 10 : outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                  />
                );
              }}
              onMouseMove={(e: any) => {
                if (!e || total === 0) return;
                if (e && e.cx && e.cy && e.midAngle) {
                  const RADIAN = Math.PI / 180;
                  const radius = 110;

                  const x = e.cx + radius * Math.cos(-e.midAngle * RADIAN);
                  const y = e.cy + radius * Math.sin(-e.midAngle * RADIAN);

                  setTooltipPos({ x, y });
                }
              }}
              onMouseEnter={(_, index) => total === 0 ? null : setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}>
              {safeData.map((_, index) => (
                <Cell key={index} fill={getColor(index)} className={`transition-all duration-300 cursor-pointer ${activeIndex === index ? "opacity-80" : ""
                  }`} />
              ))}
            </Pie>
            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              cursor={{ fill: "transparent" }}
              wrapperStyle={{ zIndex: 9999 }}
              position={
                tooltipPos
                  ? {
                    x:
                      activeIndex === 0
                        ? tooltipPos.x - 80
                        : tooltipPos.x - 10,
                    y: tooltipPos.y - 30,
                  }
                  : undefined
              }
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  const value = Number(item.value || 0);
                  const isIncome = item.name === "Income";

                  if (item.name === "No Data") {
                    return (
                      <div className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm">
                        No transactions yet
                      </div>
                    );
                  }

                  return (
                    <div className="px-4 py-2 rounded-xl shadow-xl backdrop-blur-xl bg-white text-gray-900 border border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                      <p className={`text-xs opacity-70 font-medium ${isIncome
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                        }`}>
                        {item.name}
                      </p>
                      <p className={`text-lg font-bold ${isIncome
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                        }`}>
                        ₹{value.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
          <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white relative z-10">
            {total === 0 ? "No Data" : `₹${formattedBalance}`}
          </p>
          <p className="text-xs text-gray-500 relative z-10">Balance</p>
        </motion.div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Income</span>
          <span>{incomePercent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${incomePercent}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-green-500"
          />
        </div>

        <div className="flex justify-between mt-1">
          <span>Expense</span>
          <span>{expensePercent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${expensePercent}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-red-500"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="rounded-xl p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 backdrop-blur-md">
          <p className="text-xs text-gray-500 text-center">Total Income</p>
          <p className="text-lg font-semibold text-green-600 text-center">
            ₹{formattedIncome}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          className="rounded-xl p-3 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 backdrop-blur-md">
          <p className="text-xs text-gray-500 text-center">Total Expense</p>
          <p className="text-lg font-semibold text-red-500 text-center">
            ₹{formattedExpense}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          className="rounded-xl p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 backdrop-blur-md">
          <p className="text-xs text-gray-500 text-center">Balance</p>
          <p className={`text-lg font-semibold text-center ${balance < 0 ? "text-red-500" : "text-blue-600"}`}>
            ₹{formattedBalance}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
export default React.memo(TransactionDonut);