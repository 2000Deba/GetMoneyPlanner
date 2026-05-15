"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SummaryCard from "@/components/SummaryCard";
import TransactionDonut from "@/components/TransactionDonut";
import AddTransactionForm from "@/components/AddTransactionForm";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Trash2, FileDown, Save, CircleX, Settings, Lightbulb, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, StickyNote } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

type Transaction = {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
};

type SortField = "date" | "amount" | "type";
type SortOrder = "asc" | "desc";

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

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const NOTE_MAX = 500;

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [visibleColumns, setVisibleColumns] = useState({ date: true, type: true, category: true, note: true, amount: true, });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [swipeAction, setSwipeAction] = useState<{ id: string; type: "edit" | "delete" | null }>({ id: "", type: null, });
  const [lastSwipeDirection, setLastSwipeDirection] = useState<"left" | "right" | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(today);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const noteLen = (editingTx?.note || "").length;
  const noteNearLimit = noteLen > 450;
  const noteBeforeLimit = noteLen >= 490;
  const noteAtLimit = noteLen >= NOTE_MAX;

  const isWithinTwoYears = (dateStr: string) => {
    const selected = new Date(dateStr);
    const today = new Date();

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    return selected >= twoYearsAgo && selected <= today;
  };

  const handleStartDateChange = (value: string) => {
    if (!isWithinTwoYears(value)) {
      toast.error("Start date must be within the last 2 years");
      return;
    }

    if (endDate && new Date(value) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    const today = new Date().toISOString().split("T")[0];

    if (value > today) {
      toast.error("End date cannot be in the future");
      return;
    }

    if (startDate && new Date(value) < new Date(startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setEndDate(value);
  };

  const filteredTransactions = useMemo(() => {
    const data = [...transactions];

    data.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "date":
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case "amount":
          aVal = a.amount;
          bVal = b.amount;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [transactions, sortField, sortOrder]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label = "";
      if (date.toDateString() === today.toDateString()) {
        label = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      } else {
        label = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });

    return groups;
  }, [filteredTransactions]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (search) params.append("search", search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result?.message || "Failed to fetch");

      const txData = Array.isArray(result.data) ? result.data : [];

      setTransactions(txData);
      setMeta(result.meta);

      if (!startDate && txData.length > 0) {
        const sorted = [...txData].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const oldest = sorted[0]?.date;
        if (oldest) {
          const formatted = new Date(oldest).toISOString().split("T")[0];
          setStartDate(formatted);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, startDate, endDate, search]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchTransactions();
  }, [fetchTransactions, status]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, search]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate(today);
    setSearch("");
    setPage(1);
    setIsCustomRange(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(e.target as Node)
      ) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of filteredTransactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const formatCurrency = (n: number) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.error || "Delete failed");
      }

      setTransactions((prev) => prev.filter((t) => t._id !== id));
      toast.success("Transaction deleted successfully");

      await fetchTransactions();

    } catch (err) {
      toast.error("Failed to delete transaction");
    } finally {
      setDeletingId(null);
      setSwipedId(null);
    }
  };

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
        )
      );

      setTransactions((prev) =>
        prev.filter((t) => !selectedIds.has(t._id))
      );

      await fetchTransactions();

      toast.success(`${selectedIds.size} transaction(s) deleted`);

      setSelectedIds(new Set());
    } catch (err) {
      toast.error("Bulk delete failed");
    }
  }, [selectedIds]);

  const handleExportPDF = useCallback(async () => {
    if (isPdfLoading) return;
    setIsPdfLoading(true);

    const MAX_PDF_ROWS = 1000;
    toast.loading("Generating Professional Report...", { id: "pdf" });

    const startTime = Date.now();

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(MAX_PDF_ROWS),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (search) params.append("search", search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to fetch export data");
      }

      const allData = Array.isArray(result.data) ? result.data : filteredTransactions;

      if (allData.length === 0) {
        toast.error("No transactions to export", { id: "pdf" });
        return;
      }

      if (allData.length === MAX_PDF_ROWS) {
        toast(
          "PDF export limited to 1000 transactions. Use CSV export for large datasets.",
          { icon: "⚠️" }
        );
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

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
        doc.text("GetMoneyPlanner", margin + 22, y + 3);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Transaction Summary Report", margin + 22, y + 10);

        let rightY = y;

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(
          `Generated: ${new Date().toLocaleDateString()}`,
          pageWidth - margin,
          rightY,
          { align: "right" }
        );

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

      const sortedByDate = [...allData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const pdfStartDate = sortedByDate[0]?.date;
      const pdfEndDate = sortedByDate[sortedByDate.length - 1]?.date;

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(
        `Reporting Period: ${pdfStartDate ? new Date(pdfStartDate).toLocaleDateString() : "-"} - ${pdfEndDate ? new Date(pdfEndDate).toLocaleDateString() : "-"}`,
        margin,
        y
      );

      y += 12;

      let pdfIncome = 0;
      let pdfExpense = 0;

      allData.forEach((t: Transaction) => {
        if (t.type === "income") {
          pdfIncome += t.amount;
        } else {
          pdfExpense += t.amount;
        }
      });

      const pdfBalance = pdfIncome - pdfExpense;

      const cardWidth = (pageWidth - margin * 2 - 12) / 3;
      const cardHeight = 26;

      const drawCard = (
        x: number,
        label: string,
        value: string,
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

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");

        if (valueColor) {
          doc.setTextColor(...valueColor);
        } else {
          doc.setTextColor(20);
        }

        doc.text(value, centerX, y + 19, { align: "center" });
        doc.setTextColor(0);
      };

      const balanceColor: [number, number, number] =
        pdfBalance >= 0 ? [34, 197, 94] : [239, 68, 68];

      drawCard(margin, "Total Income (INR)", formatCurrency(pdfIncome), [230, 255, 240], [34, 197, 94]);
      drawCard(margin + cardWidth + 6, "Total Expense (INR)", formatCurrency(pdfExpense), [255, 235, 235], [239, 68, 68]);
      drawCard(margin + (cardWidth + 6) * 2, "Balance (INR)", formatCurrency(pdfBalance), [230, 240, 255], balanceColor);

      y += cardHeight + 12;

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Total Transactions: ${allData.length}`, margin, y);

      y += 8;

      const tableData = sortedByDate.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.type.toUpperCase(),
        t.category,
        t.note || "-",
        formatCurrency(t.amount),
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, top: 20, bottom: 25 },
        pageBreak: "auto",
        rowPageBreak: "auto",
        head: [["Date", "Type", "Category", "Note", "Amount (INR)"]],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: "middle",
          halign: "center",
          lineColor: [220, 220, 220],
          lineWidth: 0.4,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [63, 81, 181],
          textColor: 255,
          halign: "center",
          fontStyle: "bold",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 25 },
          1: { halign: "center", cellWidth: 25 },
          2: { halign: "center", cellWidth: 30 },
          3: { halign: "center", cellWidth: 70 },
          4: { halign: "center", cellWidth: 25 },
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        theme: "grid",
        didParseCell: function (data) {
          if (data.section === "body" && Array.isArray(data.row.raw)) {
            const type = data.row.raw[1] as string;
            if (type === "INCOME") {
              data.cell.styles.fillColor = [240, 255, 240];
            }
            if (type === "EXPENSE") {
              data.cell.styles.fillColor = [255, 240, 240];
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
        const splitFooter = doc.splitTextToSize(footerText, pageWidth - margin * 2);

        doc.text(splitFooter, margin, pageHeight - 9);

        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 9,
          { align: "right" }
        );
      }

      doc.setTextColor(0);

      const elapsed = Date.now() - startTime;

      if (elapsed < 800) {
        await new Promise(r => setTimeout(r, 800 - elapsed));
      }

      doc.save(`getmoneyplanner-report-${Date.now()}.pdf`);
      toast.success(`Report Generated (${allData.length} transactions)`, { id: "pdf" });
    } catch (error) {
      console.error(error);
      toast.error("PDF generation failed", { id: "pdf" });
    } finally {
      setIsPdfLoading(false);
    }
  }, [startDate, endDate, search, filteredTransactions, session]);

  const handleExportExcel = useCallback(async () => {
    if (isExcelLoading) return;
    setIsExcelLoading(true);

    const MAX_EXCEL_ROWS = 5000;
    toast.loading("Generating Professional Excel Report...", { id: "excel" });

    const startTime = Date.now();

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(MAX_EXCEL_ROWS),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (search) params.append("search", search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to fetch export data");
      }

      const allData = Array.isArray(result.data) ? result.data : [];

      if (allData.length === 0) {
        toast.error("No transactions to export", { id: "excel" });
        return;
      }

      const sorted = [...allData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let totalIncome = 0;
      let totalExpense = 0;

      sorted.forEach((t) => {
        if (t.type === "income") totalIncome += t.amount;
        else totalExpense += t.amount;
      });

      const balance = totalIncome - totalExpense;

      const start = sorted[0]?.date;
      const end = sorted[sorted.length - 1]?.date;

      const rows: any[] = [];

      rows.push(["💰 GetMoneyPlanner", "", "", "", ""]);

      rows.push(["Financial Transactions Report", "", "", "", ""]);

      rows.push(["", "", "", "", ""]);

      rows.push(["Generated At", new Date().toLocaleString(), "", "", ""]);

      rows.push([
        "Reporting Period",
        `${start ? new Date(start).toLocaleDateString() : "-"} → ${end ? new Date(end).toLocaleDateString() : "-"
        }`, "", "", ""
      ]);

      rows.push(["Total Transactions", sorted.length, "", "", ""]);

      rows.push(["", "", "", "", ""]);

      const headerRowIndex = rows.length;

      rows.push(["Date", "Type", "Category", "Note", "Amount (INR)"]);

      sorted.forEach((t) => {
        rows.push([
          new Date(t.date).toLocaleDateString(),
          t.type.toUpperCase(),
          t.category,
          t.note || "-",
          Number(t.amount)
        ]);
      });

      rows.push(["", "", "", "", ""]);
      const summaryRowIndex = rows.length;
      rows.push(["Summary", "", "", "", ""]);
      rows.push(["Total Income", "", "", "", totalIncome]);
      rows.push(["Total Expense", "", "", "", totalExpense]);
      rows.push(["Net Balance", "", "", "", balance]);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      ws["!cols"] = [
        { wch: 18 },
        { wch: 30 },
        { wch: 20 },
        { wch: 50 },
        { wch: 16 },
      ];

      ws["!rows"] = [];
      ws["!rows"][0] = { hpt: 50 };
      ws["!rows"][1] = { hpt: 28 };
      ws["!rows"][headerRowIndex] = { hpt: 22 };

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: summaryRowIndex, c: 0 }, e: { r: summaryRowIndex, c: 4 } },
      ];

      ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex + 1 };

      ws["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: headerRowIndex + sorted.length, c: 4 },
        }),
      };

      const range = XLSX.utils.decode_range(ws["!ref"]!);

      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellRef];
          if (!cell) continue;

          cell.s = {
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: {
              top: { style: "thin", color: { rgb: "DDDDDD" } },
              bottom: { style: "thin", color: { rgb: "DDDDDD" } },
              left: { style: "thin", color: { rgb: "DDDDDD" } },
              right: { style: "thin", color: { rgb: "DDDDDD" } },
            },
          };

          if (R === 0) {
            cell.s = {
              font: { bold: true, sz: 24, color: { rgb: "1A7A4A" } },
              fill: { fgColor: { rgb: "E8F5E9" } },
              alignment: { horizontal: "center", vertical: "center" },
            };
          }

          if (R === 1) {
            cell.s = {
              font: { bold: true, sz: 13, color: { rgb: "2E86C1" } },
              fill: { fgColor: { rgb: "EBF5FB" } },
              alignment: { horizontal: "center", vertical: "center" },
            };
          }

          if (R >= 3 && R <= 5) {
            if (C === 0) {
              cell.s = {
                font: { bold: true, sz: 11, color: { rgb: "555555" } },
                fill: { fgColor: { rgb: "F2F3F4" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                  top: { style: "thin", color: { rgb: "DDDDDD" } },
                  bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                  left: { style: "thin", color: { rgb: "DDDDDD" } },
                  right: { style: "thin", color: { rgb: "DDDDDD" } },
                },
              };
            } else if (C === 1) {
              cell.s = {
                font: { sz: 11, color: { rgb: "222222" } },
                fill: { fgColor: { rgb: "FFFFFF" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                  top: { style: "thin", color: { rgb: "DDDDDD" } },
                  bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                  left: { style: "thin", color: { rgb: "DDDDDD" } },
                  right: { style: "thin", color: { rgb: "DDDDDD" } },
                },
              };
            }
          }

          if (R === headerRowIndex) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
              fill: { fgColor: { rgb: "1F4E78" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "FFFFFF" } },
                bottom: { style: "thin", color: { rgb: "FFFFFF" } },
                left: { style: "thin", color: { rgb: "FFFFFF" } },
                right: { style: "thin", color: { rgb: "FFFFFF" } },
              },
            };
          }

          if (R > headerRowIndex && R <= headerRowIndex + sorted.length) {
            const typeCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
            const isIncome = typeCell?.v === "INCOME";
            const isExpense = typeCell?.v === "EXPENSE";

            const bgColor = isIncome ? "E8F8F5" : isExpense ? "FDEDEC" : "FFFFFF";
            const textColor = isIncome ? "1E8449" : isExpense ? "C0392B" : "222222";

            cell.s = {
              font: {
                sz: 11,
                color: C === 1 ? { rgb: textColor } : { rgb: "222222" },
              },
              fill: { fgColor: { rgb: bgColor } },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } },
              },
            };
            if (C === 4) {
              cell.z = "₹#,##0.00";
            }
          }

          if (rows[R]?.[0] === "Summary") {
            cell.s = {
              font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "1F4E78" } },
              alignment: { horizontal: "center", vertical: "center" },
            };
          }

          if (rows[R]?.[0] === "Total Income") {
            cell.s = {
              font: { bold: true, sz: 11, color: { rgb: "1E8449" } },
              fill: { fgColor: { rgb: "E8F8F5" } },
              alignment: { horizontal: C === 4 ? "right" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } },
              },
            };
            if (C === 4) {
              cell.z = "₹#,##0.00";
            }
          }

          if (rows[R]?.[0] === "Total Expense") {
            cell.s = {
              font: { bold: true, sz: 11, color: { rgb: "C0392B" } },
              fill: { fgColor: { rgb: "FDEDEC" } },
              alignment: { horizontal: C === 4 ? "right" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } },
              },
            };
            if (C === 4) {
              cell.z = "₹#,##0.00";
            }
          }

          if (rows[R]?.[0] === "Net Balance") {
            cell.s = {
              font: { bold: true, sz: 11, color: { rgb: "2E86C1" } },
              fill: { fgColor: { rgb: "EBF5FB" } },
              alignment: { horizontal: C === 4 ? "right" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } },
              },
            };
            if (C === 4) {
              cell.z = "₹#,##0.00";
            }
          }
        }
      }

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Transactions Report"
      );

      const elapsed = Date.now() - startTime;

      if (elapsed < 800) {
        await new Promise(r => setTimeout(r, 800 - elapsed));
      }

      XLSX.writeFile(
        wb,
        `getmoneyplanner-report-${Date.now()}.xlsx`
      );

      toast.success(
        `Excel Report Generated (${sorted.length} transactions)`,
        { id: "excel" }
      );

    } catch (err) {
      console.error(err);
      toast.error("Excel generation failed", { id: "excel" });
    } finally {
      setIsExcelLoading(false);
    }
  }, [startDate, endDate, search]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleSelectAll = () => {
    if (filteredTransactions.length === 0) return;

    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t._id)));
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("transaction-search")?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        handleExportPDF();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && filteredTransactions.length > 0) {
        e.preventDefault();
        if (selectedIds.size === filteredTransactions.length) {
          setSelectedIds(new Set());
        } else {
          setSelectedIds(new Set(filteredTransactions.map((t) => t._id)));
        }
      }
      if (e.key === "Delete" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
      if (e.key === "Escape") {
        setActiveNote(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedIds, filteredTransactions, handleExportPDF, handleBulkDelete]);

  const inputClass = "w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400";

  const DesktopTableSkeleton = () => {
    return (
      <div className="hidden md:block overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm border-separate border-spacing-0 animate-pulse">
          <thead className="bg-gray-200/80 dark:bg-gray-800/70">
            <tr>
              {[...Array(7)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[...Array(8)].map((_, row) => (
              <tr key={row}>
                {[...Array(7)].map((_, col) => (
                  <td key={col} className="px-4 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const MobileCardSkeleton = () => {
    return (
      <div className="md:hidden space-y-4 p-2 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border bg-gray-100 dark:bg-gray-800 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16" />
            </div>

            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-40" />

            <div className="flex justify-between items-center pt-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24" />
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Income"
          amount={income}
          type="income"
          loading={loading}
        />
        <SummaryCard
          title="Total Expense"
          amount={expense}
          type="expense"
          loading={loading}
        />
        <SummaryCard
          title="Balance"
          amount={balance}
          type="balance"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddTransactionForm onSuccess={fetchTransactions} />
        <TransactionDonut income={income} expense={expense} />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-700">
          {error}
        </motion.div>
      )}

      <div className="bg-white/90 dark:bg-gray-900/70 rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 backdrop-blur-xl overflow-hidden">

        <div className="px-4 py-3 border-b border-gray-200/40 dark:border-gray-700/40 flex flex-col gap-2 md:flex-row md:justify-between md:items-center md:gap-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
            Recent Transactions
          </h3>

          <div className="flex flex-col gap-2 md:hidden">
            <motion.input
              id="transaction-search"
              aria-label="Search transactions"
              type="text"
              placeholder="Search... (Ctrl+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">From</span>
                <motion.input
                  variants={item}
                  aria-label="Start Date"
                  type="date"
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    handleStartDateChange(newStartDate);
                    setIsCustomRange(true);
                    console.log("Start Date Selected:", newStartDate);
                  }}
                />

                <span className="text-xs text-gray-500 shrink-0">To</span>
                <motion.input
                  variants={item}
                  aria-label="End Date"
                  type="date"
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={endDate}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    handleEndDateChange(newEndDate);
                    setIsCustomRange(true);
                    console.log("End Date Selected:", newEndDate);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition cursor-pointer shrink-0">
                  Reset
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  aria-label="Export transactions as PDF"
                  onClick={handleExportPDF}
                  disabled={isPdfLoading}
                  className="flex-1 px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {isPdfLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    : <><FileDown size={13} /> Export PDF</>}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  aria-label="Export transactions as Excel"
                  onClick={handleExportExcel}
                  disabled={isExcelLoading}
                  className="flex-1 px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {isExcelLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    : <><FileSpreadsheet size={13} /> Export Excel</>}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-wrap gap-2 items-center">
            <motion.input
              id="transaction-search-desktop"
              aria-label="Search transactions"
              type="text"
              placeholder="Search... (Ctrl+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">From</span>
              <motion.input
                variants={item}
                aria-label="Start Date"
                type="date"
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  handleStartDateChange(newStartDate);
                  setIsCustomRange(true);
                  console.log("Start Date Selected:", newStartDate);
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">To</span>
              <motion.input
                variants={item}
                aria-label="End Date"
                type="date"
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={endDate}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  handleEndDateChange(newEndDate);
                  setIsCustomRange(true);
                  console.log("End Date Selected:", newEndDate);
                }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-sm bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition cursor-pointer">
              Reset
            </motion.button>

            {selectedIds.size > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm flex items-center gap-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer">
                <Trash2 size={14} /> Delete ({selectedIds.size})
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              aria-label="Export transactions as PDF"
              onClick={handleExportPDF}
              disabled={isPdfLoading}
              className="px-3 py-1.5 text-sm flex items-center gap-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {isPdfLoading
                ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                : <><FileDown size={13} /> Export PDF</>}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              aria-label="Export transactions as Excel"
              onClick={handleExportExcel}
              disabled={isExcelLoading}
              className="px-3 py-1.5 text-sm flex items-center gap-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {isExcelLoading
                ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                : <><FileSpreadsheet size={13} /> Export Excel</>}
            </motion.button>

            <div ref={columnMenuRef} className="relative">
              <motion.button
                aria-expanded={showColumnMenu}
                aria-haspopup="true"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-3 py-1.5 text-sm flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer">
                <Settings size={14} /> Columns
              </motion.button>

              <AnimatePresence>
                {showColumnMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="origin-top-right absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl z-50 p-2 backdrop-blur-xl">
                    {Object.entries(visibleColumns).map(([col, visible]) => (
                      <label
                        key={col}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition">
                        <motion.input
                          variants={item}
                          type="checkbox"
                          checked={visible}
                          onChange={() =>
                            setVisibleColumns({
                              ...visibleColumns,
                              [col]: !visible,
                            })
                          }
                          className="rounded cursor-pointer"
                        />
                        <span className="text-sm capitalize">{col}</span>
                      </label>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {loading ? (
          <DesktopTableSkeleton />
        ) : (
          <div className="hidden md:block overflow-auto max-h-[600px]">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="bg-gray-200/80 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="w-[70px] px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span>Select</span>
                      <motion.input
                        variants={item}
                        type="checkbox"
                        checked={
                          selectedIds.size === filteredTransactions.length &&
                          filteredTransactions.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </div>
                  </th>

                  {visibleColumns.date && (
                    <th
                      className="w-28 px-4 py-3 text-center cursor-pointer hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition"
                      onClick={() => handleSort("date")}>
                      Date {sortField === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  )}

                  {visibleColumns.type && (
                    <th
                      className="w-28 px-4 py-3 text-center cursor-pointer hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition"
                      onClick={() => handleSort("type")}>
                      Type {sortField === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  )}

                  {visibleColumns.category && <th className="w-36 px-4 py-3 text-center">Category</th>}
                  {visibleColumns.note && <th className="w-48 px-4 py-3 text-center">Note</th>}

                  {visibleColumns.amount && (
                    <th
                      className="w-28 px-4 py-3 text-center cursor-pointer hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition"
                      onClick={() => handleSort("amount")}>
                      Amount {sortField === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  )}

                  <th className="w-36 px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={Object.values(visibleColumns).filter(Boolean).length + 2}
                      className="px-5 py-3 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}

                {filteredTransactions.map((t, idx) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`border-t border-gray-200/40 dark:border-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200 ${idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/30"
                      }`}>
                    <td className="px-5 py-3 text-center">
                      <motion.input
                        variants={item}
                        type="checkbox"
                        checked={selectedIds.has(t._id)}
                        onChange={() => {
                          const newSet = new Set(selectedIds);
                          if (newSet.has(t._id)) {
                            newSet.delete(t._id);
                          } else {
                            newSet.add(t._id);
                          }
                          setSelectedIds(newSet);
                        }}
                        className="rounded cursor-pointer"
                      />
                    </td>

                    {visibleColumns.date && (
                      <td className="px-5 py-3 text-center">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                    )}

                    {visibleColumns.type && (
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === "income"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                          {t.type}
                        </span>
                      </td>
                    )}

                    {visibleColumns.category && (
                      <td className="px-5 py-3 text-center font-medium whitespace-nowrap">{t.category}</td>
                    )}
                    {visibleColumns.note && (
                      <td className="px-5 py-3 text-center align-middle">
                        {t.note ? (
                          <div className="flex justify-center items-center w-full">
                            <motion.button
                              variants={item}
                              onClick={() => setActiveNote(t.note ?? null)}
                              className="truncate max-w-[180px] text-center text-gray-500 hover:text-indigo-600 hover:underline transition cursor-pointer">
                              {t.note}
                            </motion.button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}

                    {visibleColumns.amount && (
                      <td className="px-5 py-3 text-center font-semibold">
                        <span
                          className={
                            t.type === "income" ? "text-green-600" : "text-red-500"
                          }>
                          ₹{formatCurrency(t.amount)}
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center items-center gap-4">
                        <motion.button
                          variants={item}
                          onClick={() => setEditingTx(t)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:dark:text-indigo-600 text-xs font-medium transition cursor-pointer">
                          <Pencil size={14} />
                          Edit
                        </motion.button>

                        <motion.button
                          variants={item}
                          onClick={() => handleDelete(t._id)}
                          disabled={deletingId === t._id}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-500 hover:dark:text-red-700 text-xs font-medium transition disabled:opacity-50 cursor-pointer">
                          {deletingId === t._id ? "⏳" : <Trash2 size={14} />}
                          Delete
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isCustomRange && meta && meta.totalPages > 1 && (
          <div className="hidden md:flex px-4 py-3 border-t border-gray-200 dark:border-gray-700 items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold">{((page - 1) * limit) + 1}</span> to <span className="font-semibold">{Math.min(page * limit, meta.total)}</span> of <span className="font-semibold">{meta.total}</span> transactions
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-indigo-600 transition font-medium">
                <ChevronLeft size={16} />
                Previous
              </motion.button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (meta.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= meta.totalPages - 2) {
                    pageNum = meta.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium cursor-pointer transition ${page === pageNum
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}>
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-indigo-600 transition font-medium">
                Next
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </div>
        )}

        {loading ? (
          <MobileCardSkeleton />
        ) : (
          <div className="md:hidden space-y-4 p-2">
            {Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
              <div key={dateLabel}>
                <div className="sticky top-0 bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-lg mb-2 font-semibold text-sm z-10">
                  {dateLabel}
                </div>

                <div className="space-y-3">
                  {txs.map((t) => {
                    const isExpanded = expandedNotes === t._id;
                    const isActive = swipedId === t._id;

                    return (
                      <div key={t._id} className="relative overflow-hidden rounded-xl isolate">

                        <div className="absolute inset-0 flex items-center justify-start px-4 bg-indigo-500/10 dark:bg-indigo-500/15">
                          <motion.button
                            variants={item}
                            onClick={() => {
                              setEditingTx(t);
                              setSwipedId(null);
                            }}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow">
                            Edit
                          </motion.button>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-end px-4 bg-red-500/10 dark:bg-red-500/15">
                          <motion.button
                            variants={item}
                            onClick={() =>
                              setSwipeAction({ id: t._id, type: "delete" })
                            }
                            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow">
                            Delete
                          </motion.button>
                        </div>

                        <motion.div
                          drag="x"
                          dragConstraints={{ left: -100, right: 100 }}
                          dragElastic={0.08}
                          animate={{
                            x: isActive
                              ? lastSwipeDirection === "left"
                                ? -90
                                : 90
                              : 0,
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}

                          onDragEnd={async (_, info) => {
                            if (swipedId && swipedId !== t._id) return;

                            const swipeThreshold = 70;

                            if (info.offset.x < -swipeThreshold) {
                              setSwipedId(t._id);
                              setLastSwipeDirection("left");
                              if (navigator.vibrate) navigator.vibrate(20);

                              setTimeout(() => {
                                setSwipeAction({ id: t._id, type: "delete" });
                              }, 250);

                              setTimeout(() => {
                                setSwipedId(null);
                              }, 900);
                              return;
                            }

                            if (info.offset.x > swipeThreshold) {
                              setSwipedId(t._id);
                              setLastSwipeDirection("right");
                              if (navigator.vibrate) navigator.vibrate(20);

                              setTimeout(() => {
                                setEditingTx(t);
                              }, 250);

                              setTimeout(() => {
                                setSwipedId(null);
                              }, 900);
                              return;
                            }

                            setSwipedId(null);
                          }}
                          className={`relative z-10 p-4 space-y-2 border rounded-xl shadow-sm transition ${t.type === "income"
                            ? "bg-green-50 dark:bg-[#0f1f17] border-green-500/50"
                            : "bg-red-50 dark:bg-[#1f0f14] border-red-500/50"
                            }`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              {t.type === "income" ? (
                                <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
                              )}
                              <span>{new Date(t.date).toLocaleDateString()}</span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${t.type === "income"
                                ? "bg-green-200 text-green-800 dark:bg-green-700/40 dark:text-green-300"
                                : "bg-red-200 text-red-800 dark:bg-red-700/40 dark:text-red-300"
                                }`}>
                              {t.type.toUpperCase()}
                            </span>
                          </div>

                          <div className="font-semibold text-lg text-gray-900 dark:text-white">
                            {t.category}
                          </div>

                          {t.note && (
                            <div className="text-sm text-gray-400">
                              <motion.button
                                variants={item}
                                onClick={() => setExpandedNotes(isExpanded ? null : t._id)}
                                className="flex items-center gap-2 text-indigo-500 hover:text-indigo-600 transition font-medium">

                                <span>
                                  {isExpanded ? "Hide Notes" : "Show Notes"}
                                </span>

                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.25, ease: "easeInOut" }}
                                  className="inline-block text-sm">
                                  ▼
                                </motion.span>
                              </motion.button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="mt-2 whitespace-pre-wrap text-gray-950 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg overflow-hidden">
                                    {t.note}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2">
                            <span className={`font-bold text-xl ${t.type === "income"
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                              }`}>
                              ₹{formatCurrency(t.amount)}
                            </span>

                            <div className="flex gap-2">
                              <motion.button
                                variants={item}
                                onClick={() => setEditingTx(t)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-600 hover:bg-indigo-200 transition dark:bg-indigo-600/40 dark:text-indigo-300 dark:border-indigo-500/60 dark:hover:bg-indigo-600/60 flex items-center gap-1 text-sm font-medium">
                                <Pencil size={14} />
                                Edit
                              </motion.button>

                              <motion.button
                                variants={item}
                                onClick={() => setSwipeAction({ id: t._id, type: "delete" })}
                                className="px-3 py-1.5 rounded-lg bg-red-200 text-red-700 border border-red-600 hover:bg-red-200 transition dark:bg-red-600/40 dark:text-red-300 dark:border-red-500/60 dark:hover:bg-red-600/60 flex items-center gap-1 text-sm font-medium">
                                <Trash2 size={14} />
                                Delete
                              </motion.button>
                            </div>
                          </div>
                          <div className="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">
                            &lt; Swipe for quick actions &gt;
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {isCustomRange && meta && meta.totalPages > 1 && (
          <div className="md:hidden px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{((page - 1) * limit) + 1}-{Math.min(page * limit, meta.total)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{meta.total}</span> transactions
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                  let pageNum;

                  if (meta.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= meta.totalPages - 2) {
                    pageNum = meta.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-full font-bold transition ${page === pageNum
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-indigo-600 transition font-semibold shadow-lg">
                  <ChevronLeft size={18} />
                  Previous
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-indigo-600 transition font-semibold shadow-lg">
                  Next
                  <ChevronRight size={18} />
                </motion.button>
              </div>
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {editingTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingTx(null)}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 p-5 rounded-xl w-full max-w-md shadow-xl border border-indigo-500/40">
              <h3 className="flex items-center justify-center gap-2 text-lg font-semibold mb-4"><Pencil size={14} /> Edit Transaction</h3>

              <div className="space-y-3">
                <motion.select
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  value={editingTx.category}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, category: e.target.value })
                  }
                  className={inputClass}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </motion.select>

                <motion.input
                  variants={item}
                  type="number"
                  value={editingTx.amount}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, amount: Number(e.target.value) })
                  }
                  placeholder="Amount"
                  className={inputClass}
                  onWheel={(e) => e.currentTarget.blur()}
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
                    value={editingTx.note || ""}
                    onChange={(e) => {
                      if (e.target.value.length <= NOTE_MAX) {
                        setEditingTx({ ...editingTx, note: e.target.value })
                      }
                    }}
                  />
                  {noteAtLimit && (
                    <p className="text-xs text-red-500">Maximum {NOTE_MAX} characters reached</p>
                  )}
                </motion.div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <motion.button
                  variants={item}
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer">
                  <CircleX size={14} />
                </motion.button>
                <motion.button
                  variants={item}
                  onClick={async () => {
                    if (!editingTx.category || editingTx.amount <= 0) {
                      toast.error("Please select category and enter valid amount");
                      return;
                    }

                    try {
                      setIsSaving(true);
                      const res = await fetch(`/api/transactions`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          _id: editingTx._id,
                          type: editingTx.type,
                          amount: editingTx.amount,
                          category: editingTx.category,
                          note: editingTx.note,
                          date: editingTx.date,
                        }),
                      });

                      if (!res.ok) {
                        const result = await res.json();
                        throw new Error(result?.error || "Update failed");
                      }

                      const result = await res.json();

                      setTransactions((prev) =>
                        prev.map((t) =>
                          t._id === editingTx._id ? result.data : t
                        )
                      );
                      toast.success("Transaction updated successfully");

                      setEditingTx(null);

                    } catch (err: any) {
                      console.error(err);
                      toast.error(err.message || "Failed to update transaction");
                    } finally {
                      setIsSaving(false);
                    }
                  }
                  }
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={14} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {swipeAction.type === "delete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSwipeAction({ id: "", type: null })}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 p-5 rounded-xl w-full max-w-sm border border-red-500/40">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-500 mb-3">
                Delete Transaction?
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-100 mb-4">
                Are you sure you want to delete this transaction?
              </p>

              <div className="flex justify-end gap-2">
                <motion.button
                  variants={item}
                  onClick={() => setSwipeAction({ id: "", type: null })}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white cursor-pointer">
                  Cancel
                </motion.button>

                <motion.button
                  variants={item}
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    await handleDelete(swipeAction.id);
                    setIsDeleting(false);
                    setSwipeAction({ id: "", type: null });
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white cursor-pointer">
                  {isDeleting ? "Deleting..." : "Delete"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden text-xs text-gray-500 dark:text-gray-400 text-center sm:flex items-center justify-center gap-1">
        <Lightbulb size={14} />
        Shortcuts: Ctrl+K (Search) | Ctrl+E (Export) | Ctrl+A (Select All) | Esc (Close Note Preview Modal) | Delete (Single / Bulk Delete)
      </div>
    </div>
  );
}