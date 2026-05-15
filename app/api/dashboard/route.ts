// app/api/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { notifyBudgetAlert } from "@/lib/notifications";

async function maybeSendBudgetAlert(
  userEmail: string,
  spent: number,
  budget: number,
  currency: string
): Promise<void> {
  if (budget <= 0 || spent <= 0) return;

  const percentage = Math.round((spent / budget) * 100);
  if (percentage < 80) return;

  const alertType: "warning" | "exceeded" = percentage >= 100 ? "exceeded" : "warning";

  const user = await User.findOne({ email: userEmail })
    .select("lastBudgetAlertSentAt lastBudgetAlertType")
    .lean() as any;

  if (!user) return;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const lastSent = user.lastBudgetAlertSentAt
    ? new Date(user.lastBudgetAlertSentAt)
    : null;

  const lastType = user.lastBudgetAlertType as "warning" | "exceeded" | null;

  if (lastSent) {
    const sameMonth =
      lastSent.getFullYear() === curYear &&
      lastSent.getMonth() === curMonth;

    if (sameMonth) {
      if (lastType === "exceeded") return;

      if (lastType === "warning" && alertType === "warning") return;
    }
  }

  await notifyBudgetAlert(userEmail, { spent, budget, currency, percentage });

  await User.findOneAndUpdate(
    { email: userEmail },
    {
      $set: {
        lastBudgetAlertSentAt: now,
        lastBudgetAlertType: alertType,
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const userEmail = session.user.email;

    const allTransactions = await Transaction.find({ ownerEmail: userEmail }).lean();

    let totalIncome = 0;
    let totalExpense = 0;

    allTransactions.forEach((t: any) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    const totalBalance = totalIncome - totalExpense;

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString("default", { month: "short" }),
      income: 0,
      expense: 0,
    }));

    const yearTransactions = allTransactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getFullYear() === year;
    });

    yearTransactions.forEach((t: any) => {
      const month = new Date(t.date).getMonth(); // 0-indexed
      if (t.type === "income") monthlyData[month].income += t.amount;
      else monthlyData[month].expense += t.amount;
    });

    const categoryMap: Record<string, { income: number; expense: number }> = {};

    allTransactions.forEach((t: any) => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === "income") categoryMap[t.category].income += t.amount;
      else categoryMap[t.category].expense += t.amount;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([name, values]) => ({
      name,
      income: values.income,
      expense: values.expense,
      total: values.income + values.expense,
    })).sort((a, b) => b.total - a.total);

    const currentYear = new Date().getFullYear();
    const yearlySummary = [];

    for (let y = currentYear - 4; y <= currentYear; y++) {
      let yIncome = 0;
      let yExpense = 0;

      allTransactions.forEach((t: any) => {
        const tYear = new Date(t.date).getFullYear();
        if (tYear === y) {
          if (t.type === "income") yIncome += t.amount;
          else yExpense += t.amount;
        }
      });

      yearlySummary.push({
        year: y,
        income: yIncome,
        expense: yExpense,
        balance: yIncome - yExpense,
      });
    }

    const recentTransactions = allTransactions
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t: any) => ({
        _id: t._id,
        date: t.date,
        type: t.type,
        category: t.category,
        amount: t.amount,
        note: t.note,
      }));

    let yearIncome = 0;
    let yearExpense = 0;
    yearTransactions.forEach((t: any) => {
      if (t.type === "income") yearIncome += t.amount;
      else yearExpense += t.amount;
    });

    const yearCategoryMap: Record<string, { income: number; expense: number }> = {};
    yearTransactions.forEach((t: any) => {
      if (!yearCategoryMap[t.category]) {
        yearCategoryMap[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === "income") yearCategoryMap[t.category].income += t.amount;
      else yearCategoryMap[t.category].expense += t.amount;
    });

    const topCategories = Object.entries(yearCategoryMap)
      .map(([name, values]) => ({
        name,
        income: values.income,
        expense: values.expense,
        total: values.income + values.expense,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const prevYearTransactions = allTransactions.filter((t: any) => {
      return new Date(t.date).getFullYear() === year - 1;
    });
    let prevIncome = 0, prevExpense = 0;
    prevYearTransactions.forEach((t: any) => {
      if (t.type === "income") prevIncome += t.amount;
      else prevExpense += t.amount;
    });

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? null : parseFloat((((curr - prev) / prev) * 100).toFixed(1));

    const savingsRate = yearIncome > 0
      ? parseFloat((((yearIncome - yearExpense) / yearIncome) * 100).toFixed(1))
      : 0;

    const nowYear = new Date().getFullYear();
    if (year === nowYear) {
      const nowMonth = new Date().getMonth();

      const curMonthExpense = yearTransactions
        .filter(
          (t: any) =>
            t.type === "expense" &&
            new Date(t.date).getMonth() === nowMonth
        )
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      if (curMonthExpense > 0) {
        User.findOne({ email: userEmail })
          .select("monthlyBudget currency")
          .lean()
          .then((u: any) => {
            if (!u?.monthlyBudget || u.monthlyBudget <= 0) return;
            maybeSendBudgetAlert(
              userEmail,
              curMonthExpense,
              u.monthlyBudget,
              u.currency || "USD"
            ).catch(() => { });
          })
          .catch(() => { });
      }
    }

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        totalBalance,
        totalTransactions: allTransactions.length,
      },
      yearStats: {
        year,
        income: yearIncome,
        expense: yearExpense,
        balance: yearIncome - yearExpense,
        transactions: yearTransactions.length,
        savingsRate,
        incomeChange: pctChange(yearIncome, prevIncome),
        expenseChange: pctChange(yearExpense, prevExpense),
        balanceChange: pctChange(yearIncome - yearExpense, prevIncome - prevExpense),
        prevIncome,
        prevExpense,
      },
      monthlyData,
      categoryBreakdown,
      topCategories,
      yearlySummary,
      recentTransactions,
    });

  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
