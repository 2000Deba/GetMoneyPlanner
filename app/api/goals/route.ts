// app/api/goals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { notifyGoalCompleted, notifyGoalMilestone } from "@/lib/notifications";

function buildSafeNote(category: string, txNote?: string): string {
  const base = `Auto: ${category}`;
  if (!txNote || !txNote.trim()) return base.slice(0, 200);
  const combined = `${base} — ${txNote.trim()}`;
  return combined.length > 200 ? combined.slice(0, 197) + "…" : combined;
}

function getHighestNewMilestone(
  prevPercent: number,
  newPercent: number,
  notifiedMilestones: number[]
): number | null {
  const crossed = [25, 50, 75].filter(
    (m) => prevPercent < m && newPercent >= m && !notifiedMilestones.includes(m)
  );
  if (crossed.length === 0) return null;
  return Math.max(...crossed);
}

export async function syncGoalsForEmail(ownerEmail: string): Promise<void> {
  try {
    const linkedGoals = await Goal.find({
      ownerEmail,
      trackingMode: { $in: ["auto", "both"] },
      linkedCategory: { $ne: null },
      status: { $in: ["active", "paused"] },
    });

    if (linkedGoals.length === 0) return;

    const userDoc = await User.findOne({ email: ownerEmail }).select("currency").lean() as any;
    const currency = userDoc?.currency || "USD";

    for (const goal of linkedGoals) {
      const prevPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

      try {
        const transactions = await Transaction.find({
          ownerEmail,
          category: goal.linkedCategory,
          type: goal.linkedType || "income",
        }).lean();

        const newTxs = transactions.filter(
          (tx) => !goal.autoSyncedTxIds.includes((tx._id as any).toString())
        );

        if (newTxs.length === 0) continue;

        let addedAmount = 0;
        const newContributions: any[] = [];
        const newSyncedIds: string[] = [];

        for (const tx of newTxs) {
          const txId = (tx._id as any).toString();
          addedAmount = Math.round((addedAmount + tx.amount) * 100) / 100;
          newContributions.push({
            amount: tx.amount,
            note: buildSafeNote(tx.category, tx.note),
            date: tx.date,
            source: "auto",
            transactionId: txId,
          });
          newSyncedIds.push(txId);
        }

        const newAmount = goal.currentAmount + addedAmount;
        goal.currentAmount = newAmount >= goal.targetAmount
          ? goal.targetAmount
          : Math.round(newAmount * 100) / 100;
        goal.contributions.push(...(newContributions as any));
        goal.autoSyncedTxIds.push(...newSyncedIds);

        const willBeCompleted =
          goal.currentAmount >= goal.targetAmount && goal.status === "active";

        if (willBeCompleted) {
          goal.status = "completed";
        }

        const newPercent = goal.targetAmount > 0
          ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
          : 0;

        try {
          await goal.save();

          if (willBeCompleted) {
            notifyGoalCompleted(ownerEmail, {
              title: goal.title,
              targetAmount: goal.targetAmount,
              currency,
              icon: goal.icon || "🏆",
            }).catch(() => { });

            Goal.updateOne(
              { _id: goal._id },
              { $set: { lastCompletionNotifiedAt: new Date() } }
            ).catch(() => { });
          }

          if (!willBeCompleted) {
            const crossedMilestones = [25, 50, 75].filter(
              m => prevPercent < m && newPercent >= m && !(goal.notifiedMilestones || []).includes(m)
            );

            if (crossedMilestones.length > 0) {
              const highestMilestone = Math.max(...crossedMilestones);

              const updated = await Goal.findOneAndUpdate(
                {
                  _id: goal._id,
                  notifiedMilestones: { $not: { $all: crossedMilestones } },
                },
                { $addToSet: { notifiedMilestones: { $each: crossedMilestones } } },
                { new: true }
              );

              if (!updated) continue;

              notifyGoalMilestone(ownerEmail, {
                title: goal.title,
                percent: highestMilestone,
                currentAmount: goal.currentAmount,
                currency,
              }).catch(() => { });
            }
          }

        } catch (err: any) {
          console.error(`[syncGoalsForEmail] Failed to save goal ${goal._id}:`, err?.message);
        }

      } catch (goalErr: any) {
        console.error(`[syncGoalsForEmail] Error processing goal ${goal._id}:`, goalErr?.message);
      }
    }
  } catch (err: any) {
    console.error("[syncGoalsForEmail] Sync failed:", err?.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";

    const query: Record<string, unknown> = { ownerEmail: session.user.email };
    if (statusFilter !== "all") query.status = statusFilter;

    const goals = await Goal.find(query).sort({ createdAt: -1 }).lean();
    const allGoals = await Goal.find({ ownerEmail: session.user.email }).lean();

    const stats = {
      total: allGoals.length,
      active: allGoals.filter((g) => g.status === "active").length,
      completed: allGoals.filter((g) => g.status === "completed").length,
      paused: allGoals.filter((g) => g.status === "paused").length,
      totalSaved: allGoals.reduce((s, g) => s + (g.currentAmount || 0), 0),
      totalTarget: allGoals.reduce((s, g) => s + (g.targetAmount || 0), 0),
    };

    const goalsWithProgress = goals.map((g) => ({
      ...g,
      _id: (g._id as any).toString(),
      progressPercent:
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
          : 0,
      autoSyncedTxIds: undefined,
    }));

    return NextResponse.json({ success: true, goals: goalsWithProgress, stats });
  } catch (error) {
    console.error("[GET /api/goals]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, description, type,
      targetAmount, currentAmount,
      currency, deadline, icon, color,
      trackingMode, linkedCategory, linkedType,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!targetAmount || Number(targetAmount) < 1) {
      return NextResponse.json(
        { error: "Target amount must be at least 1" },
        { status: 400 }
      );
    }
    if (!["savings", "debt", "investment", "custom"].includes(type)) {
      return NextResponse.json({ error: "Invalid goal type" }, { status: 400 });
    }
    if (
      (trackingMode === "auto" || trackingMode === "both") &&
      !linkedCategory?.trim()
    ) {
      return NextResponse.json(
        { error: "Please select a transaction category to link for auto-tracking" },
        { status: 400 }
      );
    }

    await connectDB();

    const initial = Math.max(0, Number(currentAmount) || 0);
    const target = Math.round(Number(targetAmount));

    const goal = await Goal.create({
      ownerEmail: session.user.email,
      title: title.trim(),
      description: description?.trim().slice(0, 500) || "",
      type,
      targetAmount: target,
      currentAmount: initial,
      currency: currency || "USD",
      deadline: deadline ? new Date(deadline) : undefined,
      icon: icon || "🎯",
      color: color || "#8b5cf6",
      trackingMode: trackingMode || "manual",
      linkedCategory: linkedCategory?.trim() || null,
      linkedType: linkedType || "income",
      autoSyncedTxIds: [],
      contributions:
        initial > 0
          ? [{ amount: initial, note: "Initial amount", date: new Date(), source: "manual" }]
          : [],
    });

    if (trackingMode === "auto" || trackingMode === "both") {
      await syncGoalsForEmail(session.user.email);
      const updated = await Goal.findById(goal._id).lean();
      return NextResponse.json(
        {
          success: true,
          message: "Goal created and synced with existing transactions!",
          goal: { ...(updated as any), _id: (updated as any)._id.toString() },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Goal created successfully",
        goal: { ...goal.toObject(), _id: goal._id.toString() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/goals]", error);
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map((e: any) => e.message)[0];
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}