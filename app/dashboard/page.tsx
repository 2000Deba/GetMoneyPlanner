"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Sector, } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CalendarDays, LayoutDashboard, RefreshCw, ChevronLeft, ChevronRight, FileDown, StickyNote, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    totalTransactions: number;
  };
  yearStats: {
    year: number;
    income: number;
    expense: number;
    balance: number;
    transactions: number;
    savingsRate: number;
    incomeChange: number | null;
    expenseChange: number | null;
    balanceChange: number | null;
    prevIncome: number;
    prevExpense: number;
  };
  monthlyData: { month: number; monthName: string; income: number; expense: number }[];
  categoryBreakdown: { name: string; income: number; expense: number; total: number }[];
  topCategories: { name: string; income: number; expense: number; total: number }[];
  yearlySummary: { year: number; income: number; expense: number; balance: number }[];
  recentTransactions: {
    _id: string; date: string; type: string;
    category: string; amount: number; note?: string;
  }[];
}

const fmt = (n: number) =>
  n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(1)}Cr`
    : n >= 1_00_000 ? `₹${(n / 1_00_000).toFixed(1)}L`
      : n >= 1_000 ? `₹${(n / 1_000).toFixed(1)}K`
        : `₹${n}`;

const fullFmt = (n: number) =>
  `₹${n.toLocaleString("en-IN")}`;

const pdfFmt = (n: number) => n.toLocaleString("en-IN");

const PIE_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6",
  "#a855f7", "#ec4899", "#0ea5e9", "#84cc16", "#f97316",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fullFmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function SummaryCard({
  title, value, icon, color, sub, loading, isCount,
}: {
  title: string; value: number; icon: React.ReactNode;
  color: string; sub?: string; loading: boolean; isCount?: boolean;
}) {
  return (
    <motion.div
      variants={cardAnim}
      className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm h-full ${color}`}>
      <div className="flex flex-col h-full gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium opacity-70 leading-tight flex-1">{title}</p>
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
            {icon}
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-24 rounded-lg bg-current opacity-10 animate-pulse" />
        ) : (
          <p className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            {isCount ? value : fullFmt(value)}
          </p>
        )}
        {sub && <p className="text-xs opacity-60">{sub}</p>}
      </div>
    </motion.div>
  );
}

function SectionCard({ title, children, className = "" }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      variants={cardAnim}
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<"income" | "expense" | "both">("both");
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);
  const [activeIncomeIndex, setActiveIncomeIndex] = useState<number | null>(null);
  const [expenseTooltipPos, setExpenseTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [incomeTooltipPos, setIncomeTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchDashboard = useCallback(async (y: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard?year=${y}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDashboard(year);
  }, [year, fetchDashboard, status]);

  const handleExportPDF = useCallback(async () => {
    if (!data) return;
    setIsPdfLoading(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    toast.loading("Generating Dashboard Report...", { id: "pdf" });

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const logoImg = "/GetMoneyPlanner.png";
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const userName = session?.user?.name || "Valued User";
      const userEmail = session?.user?.email || "";

      const drawFirstPageHeader = () => {
        let y = 20;
        doc.setFillColor(63, 81, 181);
        doc.rect(0, 0, pageWidth, 6, "F");
        doc.addImage(logoImg, "PNG", margin, y - 5, 16, 16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(0);
        doc.text("GetMoneyPlanner", margin + 22, y + 3);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Financial Dashboard Report", margin + 22, y + 10);
        let rightY = y;
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, rightY, { align: "right" });
        rightY += 5;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Prepared For", pageWidth - margin, rightY, { align: "right" });
        rightY += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.text(userName, pageWidth - margin, rightY, { align: "right" });
        if (userEmail) {
          rightY += 4;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(userEmail, pageWidth - margin, rightY, { align: "right" });
        }
        doc.setTextColor(0);
        const headerBottomY = y + 15;
        doc.setDrawColor(210);
        doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);
        return headerBottomY + 8;
      };

      let y = drawFirstPageHeader();

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Report Year: ${year}  |  All-Time Summary included`, margin, y);
      y += 12;

      const cardWidth = (pageWidth - margin * 2 - 12) / 3;
      const cardHeight = 26;

      const drawCard = (
        x: number, label: string, value: string,
        bgColor: [number, number, number],
        valueColor?: [number, number, number]
      ) => {
        doc.setFillColor(...bgColor);
        doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, "F");
        const centerX = x + cardWidth / 2;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(label, centerX, y + 9, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(valueColor ?? [20, 20, 20] as [number, number, number]));
        doc.text(value, centerX, y + 19, { align: "center" });
        doc.setTextColor(0);
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Overall Summary (All Time)", margin, y);
      y += 6;

      drawCard(margin, "Total Income (INR)", pdfFmt(data.summary.totalIncome), [230, 255, 240], [34, 197, 94]);
      drawCard(margin + cardWidth + 6, "Total Expense (INR)", pdfFmt(data.summary.totalExpense), [255, 235, 235], [239, 68, 68]);
      const balColor: [number, number, number] = data.summary.totalBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
      drawCard(margin + (cardWidth + 6) * 2, "Net Balance (INR)", pdfFmt(data.summary.totalBalance), [230, 240, 255], balColor);
      y += cardHeight + 6;

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Transactions: ${data.summary.totalTransactions}`, margin, y);
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Year ${year} Summary`, margin, y);
      y += 6;

      drawCard(margin, `Income ${year}`, pdfFmt(data.yearStats.income), [230, 255, 240], [34, 197, 94]);
      drawCard(margin + cardWidth + 6, `Expense ${year}`, pdfFmt(data.yearStats.expense), [255, 235, 235], [239, 68, 68]);
      const balColor2: [number, number, number] = data.yearStats.balance >= 0 ? [34, 197, 94] : [239, 68, 68];
      drawCard(margin + (cardWidth + 6) * 2, `Balance ${year}`, pdfFmt(data.yearStats.balance), [230, 240, 255], balColor2);
      y += cardHeight + 6;

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      doc.text(`Savings Rate: ${data.yearStats.savingsRate}%  |  Transactions: ${data.yearStats.transactions}`, margin, y);
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Monthly Breakdown — ${year}`, margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, top: 20, bottom: 25 },
        head: [["Month", "Income (INR)", "Expense (INR)", "Balance (INR)"]],
        body: data.monthlyData.map((m) => [
          m.monthName,
          pdfFmt(m.income),
          pdfFmt(m.expense),
          pdfFmt(m.income - m.expense),
        ]),
        styles: { fontSize: 9, cellPadding: 4, valign: "middle", halign: "center", lineColor: [200, 200, 200], lineWidth: 0.4 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: "bold" },
        theme: "grid",
        didParseCell: (hookData) => {
          if (hookData.section === "body") {
            const rowIndex = hookData.row.index;
            const isEven = rowIndex % 2 === 0;

            if (hookData.column.index === 0) {
              hookData.cell.styles.fillColor = isEven ? [235, 245, 255] : [220, 235, 255];
              hookData.cell.styles.textColor = [40, 40, 120];
              hookData.cell.styles.fontStyle = "bold";
            } else if (hookData.column.index === 1) {
              hookData.cell.styles.fillColor = isEven ? [235, 255, 240] : [215, 245, 225];
              hookData.cell.styles.textColor = [34, 139, 73];
            } else if (hookData.column.index === 2) {
              hookData.cell.styles.fillColor = isEven ? [255, 235, 235] : [245, 215, 215];
              hookData.cell.styles.textColor = [200, 50, 50];
            } else if (hookData.column.index === 3) {
              const raw = hookData.cell.raw as string;
              const num = parseFloat(raw.replace(/[^0-9.-]/g, ""));
              if (num > 0) {
                hookData.cell.styles.fillColor = isEven ? [235, 255, 240] : [215, 245, 225];
                hookData.cell.styles.textColor = [34, 139, 73];
              } else if (num < 0) {
                hookData.cell.styles.fillColor = isEven ? [255, 235, 235] : [245, 215, 215];
                hookData.cell.styles.textColor = [200, 50, 50];
              } else {
                hookData.cell.styles.fillColor = isEven ? [240, 240, 250] : [225, 225, 245];
                hookData.cell.styles.textColor = [100, 100, 160];
              }
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 14;

      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Top Categories — ${year}`, margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, top: 20, bottom: 25 },
        head: [["Category", "Income (INR)", "Expense (INR)", "Total (INR)"]],
        body: data.topCategories.map((c) => [c.name, pdfFmt(c.income), pdfFmt(c.expense), pdfFmt(c.total)]),
        styles: { fontSize: 9, cellPadding: 4, valign: "middle", halign: "center", lineColor: [200, 200, 200], lineWidth: 0.4 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: "bold" },
        theme: "grid",
        didParseCell: (hookData) => {
          if (hookData.section === "body") {
            const rowIndex = hookData.row.index;
            const isEven = rowIndex % 2 === 0;
            if (hookData.column.index === 0) {
              hookData.cell.styles.fillColor = isEven ? [235, 245, 255] : [220, 235, 255];
              hookData.cell.styles.textColor = [40, 40, 120];
              hookData.cell.styles.fontStyle = "bold";
            } else if (hookData.column.index === 1) {
              hookData.cell.styles.fillColor = isEven ? [235, 255, 240] : [215, 245, 225];
              hookData.cell.styles.textColor = [34, 139, 73];
            } else if (hookData.column.index === 2) {
              hookData.cell.styles.fillColor = isEven ? [255, 235, 235] : [245, 215, 215];
              hookData.cell.styles.textColor = [200, 50, 50];
            } else if (hookData.column.index === 3) {
              hookData.cell.styles.fillColor = isEven ? [235, 245, 255] : [220, 235, 255];
              hookData.cell.styles.textColor = [30, 80, 180];
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 14;

      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Yearly Analysis — Last 5 Years", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, top: 20, bottom: 25 },
        head: [["Year", "Income (INR)", "Expense (INR)", "Balance (INR)"]],
        body: data.yearlySummary.map((r) => [
          String(r.year),
          pdfFmt(r.income),
          pdfFmt(r.expense),
          pdfFmt(r.balance),
        ]),
        styles: { fontSize: 9, cellPadding: 4, valign: "middle", halign: "center", lineColor: [200, 200, 200], lineWidth: 0.4 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: "bold" },
        theme: "grid",
        didParseCell: (hookData) => {
          if (hookData.section === "body") {
            const rowIndex = hookData.row.index;
            const isEven = rowIndex % 2 === 0;
            if (hookData.column.index === 0) {
              hookData.cell.styles.fillColor = isEven ? [235, 245, 255] : [220, 235, 255];
              hookData.cell.styles.textColor = [40, 40, 120];
              hookData.cell.styles.fontStyle = "bold";
            } else if (hookData.column.index === 1) {
              hookData.cell.styles.fillColor = isEven ? [235, 255, 240] : [215, 245, 225];
              hookData.cell.styles.textColor = [34, 139, 73];
            } else if (hookData.column.index === 2) {
              hookData.cell.styles.fillColor = isEven ? [255, 235, 235] : [245, 215, 215];
              hookData.cell.styles.textColor = [200, 50, 50];
            } else if (hookData.column.index === 3) {
              const raw = hookData.cell.raw as string;
              const num = parseFloat(raw.replace(/[^0-9.-]/g, ""));
              if (num > 0) {
                hookData.cell.styles.fillColor = isEven ? [235, 255, 240] : [215, 245, 225];
                hookData.cell.styles.textColor = [34, 139, 73];
              } else if (num < 0) {
                hookData.cell.styles.fillColor = isEven ? [255, 235, 235] : [245, 215, 215];
                hookData.cell.styles.textColor = [200, 50, 50];
              } else {
                hookData.cell.styles.fillColor = isEven ? [240, 240, 250] : [225, 225, 245];
                hookData.cell.styles.textColor = [100, 100, 160];
              }
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 14;

      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Recent Transactions", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, top: 20, bottom: 25 },
        head: [["Date", "Type", "Category", "Note", "Amount (INR)"]],
        body: data.recentTransactions.map((t) => [
          new Date(t.date).toLocaleDateString("en-IN"),
          t.type.toUpperCase(),
          t.category,
          t.note || "-",
          pdfFmt(t.amount),
        ]),
        styles: { fontSize: 9, cellPadding: 4, valign: "middle", halign: "center", lineColor: [200, 200, 200], lineWidth: 0.4 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, halign: "center", fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 26 },
          2: { cellWidth: 28 },
          3: { cellWidth: 68 },
          4: { cellWidth: 25 },
        },
        theme: "grid",
        didParseCell: (hookData) => {
          if (hookData.section === "body" && Array.isArray(hookData.row.raw)) {
            const type = hookData.row.raw[1] as string;
            const rowIndex = hookData.row.index;
            const isEven = rowIndex % 2 === 0;
            if (type === "INCOME") {
              hookData.cell.styles.fillColor = isEven ? [235, 255, 240] : [215, 245, 225];
              if (hookData.column.index === 1) hookData.cell.styles.textColor = [34, 139, 73];
            } else if (type === "EXPENSE") {
              hookData.cell.styles.fillColor = isEven ? [255, 235, 235] : [245, 215, 215];
              if (hookData.column.index === 1) hookData.cell.styles.textColor = [200, 50, 50];
            }
          }
        },
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(63, 81, 181);
        doc.rect(0, 0, pageWidth, 6, "F");
        doc.setFontSize(9);
        doc.setDrawColor(220);
        doc.setTextColor(100);
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
        const footerText = `Generated by GetMoneyPlanner | Confidential Report generated for ${userName}`;
        doc.text(doc.splitTextToSize(footerText, pageWidth - margin * 2), margin, pageHeight - 9);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: "right" });
      }

      doc.setTextColor(0);
      doc.save(`getmoneyplanner-dashboard-${year}${Date.now()}.pdf`);
      toast.success("Dashboard Report Generated!", { id: "pdf" });
    } catch (error) {
      console.error(error);
      toast.error("PDF generation failed", { id: "pdf" });
    } finally {
      setIsPdfLoading(false);
    }
  }, [data, year, session]);

  const skeletonClass = "h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse";

  const monthlyChartData = data?.monthlyData.map((m) => ({
    name: m.monthName,
    ...(activeTab === "both"
      ? { Income: m.income, Expense: m.expense }
      : activeTab === "income"
        ? { Income: m.income }
        : { Expense: m.expense }),
  })) ?? [];

  const pieData = (data?.topCategories ?? [])
    .filter((c) => c.expense > 0)
    .map((c) => ({ name: c.name, value: c.expense }));

  const incomePieData = (data?.topCategories ?? [])
    .filter((c) => c.income > 0)
    .map((c) => ({ name: c.name, value: c.income }));

  return (
    <div id="dashboard-content" className="p-4 md:p-6 space-y-6">

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={20} className="text-indigo-500" />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Dashboard</h1>
        </div>
        <div className="flex items-center justify-end gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => fetchDashboard(year)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer">
            <RefreshCw size={13} /> Refresh
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={handleExportPDF}
            disabled={isPdfLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition cursor-pointer border border-red-200 dark:border-red-800 disabled:opacity-60 disabled:cursor-not-allowed">
            {isPdfLoading
              ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
              : <><FileDown size={13} /> Export PDF</>}
          </motion.button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-700 text-sm">
          {error}
        </div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-stretch">
        <SummaryCard
          title="Total Income (All Time)"
          value={data?.summary.totalIncome ?? 0}
          icon={<TrendingUp size={18} className="text-white" />}
          color="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400"
          loading={loading}
        />
        <SummaryCard
          title="Total Expense (All Time)"
          value={data?.summary.totalExpense ?? 0}
          icon={<TrendingDown size={18} className="text-white" />}
          color="bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400"
          loading={loading}
        />
        <SummaryCard
          title="Net Balance (All Time)"
          value={data?.summary.totalBalance ?? 0}
          icon={<Wallet size={18} className="text-white" />}
          color="bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-400"
          loading={loading}
        />
        <SummaryCard
          title="Total Transactions (All Time)"
          value={data?.summary.totalTransactions ?? 0}
          icon={<CalendarDays size={18} className="text-white" />}
          color="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-400"
          loading={loading}
          isCount={true}
        />
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        <motion.div
          variants={cardAnim}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Select Year</h3>
          <div className="flex items-center justify-between gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setYear(y => y - 1)}
              disabled={year <= new Date().getFullYear() - 5}
              className={`p-2 rounded-lg transition ${year <= new Date().getFullYear() - 5
                ? "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                }`}>
              <ChevronLeft size={16} />
            </motion.button>
            <span className="text-2xl font-bold text-indigo-500">{year}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setYear(y => Math.min(new Date().getFullYear(), y + 1))}
              disabled={year >= new Date().getFullYear()}
              className={`p-2 rounded-lg transition ${year >= new Date().getFullYear()
                ? "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                }`}>
              <ChevronRight size={16} />
            </motion.button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transactions</span>
              <span className="font-semibold">{loading ? "—" : data?.yearStats.transactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Income</span>
              <span className="font-semibold text-green-600">{loading ? "—" : fmt(data?.yearStats.income ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expense</span>
              <span className="font-semibold text-red-500">{loading ? "—" : fmt(data?.yearStats.expense ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
              <span className="text-gray-500 font-medium">Balance</span>
              <span className={`font-bold ${(data?.yearStats.balance ?? 0) >= 0 ? "text-indigo-600" : "text-red-500"}`}>
                {loading ? "—" : fmt(data?.yearStats.balance ?? 0)}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardAnim} className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <ArrowUpRight size={16} />
                <span className="text-xs font-semibold">Income {year}</span>
              </div>
              {data?.yearStats.incomeChange !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(data?.yearStats.incomeChange ?? 0) >= 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                  }`}>
                  {(data?.yearStats.incomeChange ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(data?.yearStats.incomeChange ?? 0)}%
                </span>
              )}
            </div>
            {loading ? <div className={`${skeletonClass} w-24 h-7`} /> :
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{fullFmt(data?.yearStats.income ?? 0)}</p>}
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {year - 1} income</p>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{fullFmt(data?.yearStats.prevIncome ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">Income rate</p>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {loading ? "—" : `${data && data.summary.totalIncome > 0
                    ? ((data.yearStats.income / data.summary.totalIncome) * 100).toFixed(1)
                    : 0}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                <ArrowDownRight size={16} />
                <span className="text-xs font-semibold">Expense {year}</span>
              </div>
              {data?.yearStats.expenseChange !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(data?.yearStats.expenseChange ?? 0) <= 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                  }`}>
                  {(data?.yearStats.expenseChange ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(data?.yearStats.expenseChange ?? 0)}%
                </span>
              )}
            </div>
            {loading ? <div className={`${skeletonClass} w-24 h-7`} /> :
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{fullFmt(data?.yearStats.expense ?? 0)}</p>}
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {year - 1} expense</p>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{fullFmt(data?.yearStats.prevExpense ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Expense rate</p>
                <span className="text-sm font-bold text-red-500 dark:text-red-400">
                  {loading ? "—" : `${data && data.summary.totalExpense > 0
                    ? ((data.yearStats.expense / data.summary.totalExpense) * 100).toFixed(1)
                    : 0}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <Wallet size={16} />
                <span className="text-xs font-semibold">Balance {year}</span>
              </div>
              {data?.yearStats.balanceChange !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(data?.yearStats.balanceChange ?? 0) >= 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                  }`}>
                  {(data?.yearStats.balanceChange ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(data?.yearStats.balanceChange ?? 0)}%
                </span>
              )}
            </div>
            {loading ? <div className={`${skeletonClass} w-24 h-7`} /> :
              <p className={`text-xl font-bold ${(data?.yearStats.balance ?? 0) >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500"}`}>
                {fullFmt(data?.yearStats.balance ?? 0)}
              </p>}
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">{year - 1} balance</p>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {loading ? "—" : fullFmt((data?.yearStats.prevIncome ?? 0) - (data?.yearStats.prevExpense ?? 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">Savings rate</p>
                <span className={`text-sm font-bold ${(data?.yearStats.savingsRate ?? 0) >= 20
                  ? "text-green-600 dark:text-green-400"
                  : (data?.yearStats.savingsRate ?? 0) >= 0
                    ? "text-amber-500"
                    : "text-red-500"
                  }`}>
                  {loading ? "—" : `${data?.yearStats.savingsRate ?? 0}%`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={cardAnim} initial="hidden" animate="show">
        <SectionCard title={`Monthly Income vs Expense — ${year}`}>
          <div className="flex gap-2 mb-4">
            {(["both", "income", "expense"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer capitalize ${activeTab === tab
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}>
                {tab === "both" ? "Both" : tab === "income" ? "Income Only" : "Expense Only"}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyChartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {(activeTab === "both" || activeTab === "income") && (
                  <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                )}
                {(activeTab === "both" || activeTab === "expense") && (
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <SectionCard title="Expense by Category (This Year)">
          {loading ? (
            <div className="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : pieData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">No expense data</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    onMouseMove={(e: any) => {
                      if (e && e.cx && e.cy && e.midAngle !== undefined) {
                        const RADIAN = Math.PI / 180;
                        const radius = 110;
                        const x = e.cx + radius * Math.cos(-e.midAngle * RADIAN);
                        const y = e.cy + radius * Math.sin(-e.midAngle * RADIAN);
                        setExpenseTooltipPos({ x, y });
                      }
                    }}
                    onMouseEnter={(_, index) => setActiveExpenseIndex(index)}
                    onMouseLeave={() => { setActiveExpenseIndex(null); setExpenseTooltipPos(null); }}
                    onTouchMove={(e: any) => {
                      if (e && e.cx && e.cy && e.midAngle !== undefined) {
                        const RADIAN = Math.PI / 180;
                        const radius = 110;
                        const x = e.cx + radius * Math.cos(-e.midAngle * RADIAN);
                        const y = e.cy + radius * Math.sin(-e.midAngle * RADIAN);
                        setExpenseTooltipPos({ x, y });
                        setActiveExpenseIndex(e.index ?? null);
                      }
                    }}
                    activeShape={(props: PieSectorDataItem) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props as any;
                      const isActive = index === activeExpenseIndex;
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
                    }}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    allowEscapeViewBox={{ x: true, y: true }}
                    cursor={{ fill: "transparent" }}
                    wrapperStyle={{
                      zIndex: 9999,
                      visibility: expenseTooltipPos ? "visible" : "hidden",
                    }}
                    position={
                      expenseTooltipPos
                        ? {
                          x: (activeExpenseIndex ?? 0) <= 1 ? expenseTooltipPos.x - 90 : expenseTooltipPos.x - 10,
                          y: expenseTooltipPos.y - 30,
                        }
                        : undefined
                    }
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const color = PIE_COLORS[pieData.findIndex(d => d.name === item.name) % PIE_COLORS.length];
                      return (
                        <div className="px-4 py-2 rounded-xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium opacity-70" style={{ color }}>{item.name}</p>
                          <p className="text-base font-bold" style={{ color }}>{fullFmt(Number(item.value))}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {(() => {
                const total = pieData.reduce((s, d) => s + d.value, 0);
                return (
                  <div className="space-y-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 truncate">{d.name}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${total > 0 ? (d.value / total * 100).toFixed(1) : 0}%`,
                              backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                          {total > 0 ? (d.value / total * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Income by Category (This Year)">
          {loading ? (
            <div className="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : incomePieData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">No income data</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    onMouseMove={(e: any) => {
                      if (e && e.cx && e.cy && e.midAngle !== undefined) {
                        const RADIAN = Math.PI / 180;
                        const radius = 110;
                        const x = e.cx + radius * Math.cos(-e.midAngle * RADIAN);
                        const y = e.cy + radius * Math.sin(-e.midAngle * RADIAN);
                        setIncomeTooltipPos({ x, y });
                      }
                    }}
                    onMouseEnter={(_, index) => setActiveIncomeIndex(index)}
                    onMouseLeave={() => { setActiveIncomeIndex(null); setIncomeTooltipPos(null); }}
                    onTouchMove={(e: any) => {
                      if (e && e.cx && e.cy && e.midAngle !== undefined) {
                        const RADIAN = Math.PI / 180;
                        const radius = 110;
                        const x = e.cx + radius * Math.cos(-e.midAngle * RADIAN);
                        const y = e.cy + radius * Math.sin(-e.midAngle * RADIAN);
                        setIncomeTooltipPos({ x, y });
                        setActiveIncomeIndex(e.index ?? null);
                      }
                    }}
                    activeShape={(props: PieSectorDataItem) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props as any;
                      const isActive = index === activeIncomeIndex;
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
                    }}>
                    {incomePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    allowEscapeViewBox={{ x: true, y: true }}
                    cursor={{ fill: "transparent" }}
                    wrapperStyle={{
                      zIndex: 9999,
                      visibility: incomeTooltipPos ? "visible" : "hidden",
                    }}
                    position={
                      incomeTooltipPos
                        ? {
                          x: (activeIncomeIndex ?? 0) <= 1 ? incomeTooltipPos.x - 90 : incomeTooltipPos.x - 10,
                          y: incomeTooltipPos.y - 30,
                        }
                        : undefined
                    }
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const color = PIE_COLORS[incomePieData.findIndex(d => d.name === item.name) % PIE_COLORS.length];
                      return (
                        <div className="px-4 py-2 rounded-xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium opacity-70" style={{ color }}>{item.name}</p>
                          <p className="text-base font-bold" style={{ color }}>{fullFmt(Number(item.value))}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {(() => {
                const total = incomePieData.reduce((s, d) => s + d.value, 0);
                return (
                  <div className="space-y-2">
                    {incomePieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 truncate">{d.name}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${total > 0 ? (d.value / total * 100).toFixed(1) : 0}%`,
                              backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                          {total > 0 ? (d.value / total * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </SectionCard>
      </motion.div>

      <motion.div variants={cardAnim} initial="hidden" animate="show">
        <SectionCard title="Yearly Analysis — Last 5 Years">
          {loading ? (
            <div className="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.yearlySummary ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </motion.div>

      <motion.div variants={cardAnim} initial="hidden" animate="show">
        <SectionCard title="Yearly Transaction Report">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`${skeletonClass} h-8`} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <th className="px-4 py-2 text-left font-semibold rounded-l-lg">Year</th>
                    <th className="px-4 py-2 text-right font-semibold">Income</th>
                    <th className="px-4 py-2 text-right font-semibold">Expense</th>
                    <th className="px-4 py-2 text-right font-semibold rounded-r-lg">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(data?.yearlySummary ?? []).map((row) => (
                    <tr
                      key={row.year}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${row.year === year ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}>
                      <td className="px-4 py-2.5 font-medium">
                        {row.year}
                        {row.year === year && (
                          <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-600 font-medium">{fullFmt(row.income)}</td>
                      <td className="px-4 py-2.5 text-right text-red-500 font-medium">{fullFmt(row.expense)}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${row.balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500"}`}>
                        {fullFmt(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </motion.div>

      <motion.div variants={cardAnim} initial="hidden" animate="show">
        <SectionCard title={`Top Categories — ${year}`}>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`${skeletonClass} h-8`} />
              ))}
            </div>
          ) : (data?.topCategories ?? []).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No data for {year}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <th className="px-4 py-2 text-left font-semibold rounded-l-lg">Category</th>
                    <th className="px-4 py-2 text-right font-semibold">Income</th>
                    <th className="px-4 py-2 text-right font-semibold">Expense</th>
                    <th className="px-4 py-2 text-right font-semibold rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(data?.topCategories ?? []).map((cat, i) => (
                    <tr key={cat.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-600">{fullFmt(cat.income)}</td>
                      <td className="px-4 py-2.5 text-right text-red-500">{fullFmt(cat.expense)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{fullFmt(cat.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </motion.div>

      <motion.div variants={cardAnim} initial="hidden" animate="show">
        <SectionCard title="Recent Transactions">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`${skeletonClass} h-12`} />
              ))}
            </div>
          ) : (data?.recentTransactions ?? []).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No transactions found</p>
          ) : (
            <>
              <div className="space-y-2">
                {(data?.recentTransactions ?? []).map((t) => (
                  <div
                    key={t._id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${t.type === "income"
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
                      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900"
                      }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                        {t.type === "income"
                          ? <ArrowUpRight size={14} className="text-green-600 dark:text-green-400" />
                          : <ArrowDownRight size={14} className="text-red-500 dark:text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.category}</p>
                        {t.note ? (
                          <p
                            onClick={() => setActiveNote(t.note ?? null)}
                            className="text-xs text-gray-400 cursor-pointer hover:text-indigo-500 hover:underline transition">
                            {`${new Date(t.date).toLocaleDateString()} • ${t.note.slice(0, 30)}${t.note.length > 30 ? "…" : ""}`}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${t.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                      {t.type === "income" ? "+\u00A0" : "-\u00A0"}{fullFmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/transactions"
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition cursor-pointer">
                  View All Transactions
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </>
          )}
        </SectionCard>
      </motion.div>

      <AnimatePresence>
        {activeNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setActiveNote(null)}>

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-lg p-6 border border-indigo-500/20">

              <motion.button
                variants={item}
                onClick={() => setActiveNote(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition text-lg cursor-pointer">
                ✕
              </motion.button>

              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                <StickyNote size={18} className="text-indigo-500" />
                Transaction Note
              </h3>

              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto pr-2">
                {activeNote}
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  variants={item}
                  onClick={() => setActiveNote(null)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-150 shadow-md hover:shadow-lg cursor-pointer">
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
