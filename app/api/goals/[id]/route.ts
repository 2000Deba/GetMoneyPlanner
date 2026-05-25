// app/api/goals/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import mongoose from "mongoose";
import { notifyGoalCompleted, notifyGoalMilestone } from "@/lib/notifications";
import User from "@/models/User";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function checkAndNotify(
  ownerEmail: string,
  goal: any,
  prevPercent: number,
  options?: { force?: boolean }
): Promise<void> {
  const newPercent = goal.targetAmount > 0
    ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
    : 0;

  const force = options?.force || false;

  if (goal.status === "completed" || newPercent >= 100) {
    if (!force && goal.lastCompletionNotifiedAt) {
      return;
    }
    if (force || prevPercent < 100) {
      const user = await User.findOne({ email: ownerEmail })
        .select("currency").lean() as any;
      notifyGoalCompleted(ownerEmail, {
        title: goal.title,
        targetAmount: goal.targetAmount,
        currency: user?.currency || goal.currency || "USD",
        icon: goal.icon || "🏆",
      }).catch(() => { });

      Goal.updateOne(
        { _id: goal._id },
        { $set: { lastCompletionNotifiedAt: new Date() } }
      ).catch(() => { });
    }
    return;
  }

  const milestones = [25, 50, 75];
  const crossedMilestones = milestones.filter(
    m => prevPercent < m && newPercent >= m && !(goal.notifiedMilestones || []).includes(m)
  );

  if (crossedMilestones.length > 0) {
    Goal.updateOne(
      { _id: goal._id },
      { $addToSet: { notifiedMilestones: { $each: crossedMilestones } } }
    ).catch(() => { });

    const highestMilestone = Math.max(...crossedMilestones);

    const user = await User.findOne({ email: ownerEmail })
      .select("currency").lean() as any;

    notifyGoalMilestone(ownerEmail, {
      title: goal.title,
      percent: highestMilestone,
      currentAmount: goal.currentAmount,
      currency: user?.currency || goal.currency || "USD",
    }).catch(() => { });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerEmail = session.user.email;
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
    }

    await connectDB();

    const goal = await Goal.findOne({ _id: id, ownerEmail });
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "update") {
      const {
        title, description, type,
        targetAmount, currency, deadline,
        icon, color, trackingMode, linkedCategory, linkedType,
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
      if (
        (trackingMode === "auto" || trackingMode === "both") &&
        !linkedCategory?.trim()
      ) {
        return NextResponse.json(
          { error: "Please select a category to link for auto-tracking" },
          { status: 400 }
        );
      }

      const prevCategory = goal.linkedCategory;
      const prevMode = goal.trackingMode;
      const prevPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;
      const prevStatus = goal.status;
      const prevTarget = goal.targetAmount;

      const newTargetAmount = Math.round(Number(targetAmount));
      const percentWithNewTarget = newTargetAmount > 0
        ? Math.round((goal.currentAmount / newTargetAmount) * 100)
        : 0;
      const milestonesAlreadyPassed = [25, 50, 75].filter(
        (m) => percentWithNewTarget >= m
      );
      const highestCrossedOnReactivation = milestonesAlreadyPassed.at(-1) ?? null;

      const highestCrossedForActiveGoalEarly = (() => {
        const crossed = [25, 50, 75].filter(m => percentWithNewTarget >= m);
        return crossed.length > 0 ? Math.max(...crossed) : null;
      })();

      if (prevTarget !== Number(body.targetAmount)) {
        goal.lastCompletionNotifiedAt = undefined as any;
      }

      goal.title = title.trim();
      goal.description = (description?.trim() || "").slice(0, 500);
      goal.type = type || goal.type;
      goal.targetAmount = newTargetAmount;
      goal.currency = currency || goal.currency;
      goal.deadline = deadline ? new Date(deadline) : (undefined as any);
      goal.icon = icon || goal.icon;
      goal.color = color || goal.color;
      goal.trackingMode = trackingMode || goal.trackingMode;
      goal.linkedCategory = linkedCategory?.trim() || null;
      goal.linkedType = linkedType || goal.linkedType;

      if (
        prevCategory !== goal.linkedCategory ||
        prevMode !== goal.trackingMode
      ) {
        goal.autoSyncedTxIds = [];
        goal.contributions = goal.contributions.filter(
          (c: any) => c.source !== "auto"
        ) as any;
        goal.currentAmount = goal.contributions.reduce(
          (sum: number, c: any) => sum + c.amount,
          0
        );
      }

      if (goal.currentAmount > goal.targetAmount) {
        goal.currentAmount = goal.targetAmount;
      }

      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = "completed";
        goal.notifiedMilestones = [25, 50, 75];
      } else {
        if (goal.status === "completed") {
          goal.status = "active";
          goal.autoSyncedTxIds = [];

          goal.notifiedMilestones = milestonesAlreadyPassed;
          (goal as any)._highestCrossed = highestCrossedOnReactivation;

          goal.contributions = goal.contributions.filter(
            (c: any) => c.source !== "auto"
          ) as any;
          goal.currentAmount = goal.contributions.reduce(
            (sum: number, c: any) => sum + c.amount,
            0
          );
        }
      }

      await goal.save();

      const nowCompleted = (goal.status as string) === "completed";
      const targetChanged = prevTarget !== goal.targetAmount;
      const newlyCompleted =
        (prevStatus !== "completed" && nowCompleted) ||
        (targetChanged && nowCompleted);

      const goalReactivated = prevStatus === "completed" && !nowCompleted && targetChanged;
      const highestCrossed = (goal as any)._highestCrossed ?? null;
      const activeTargetChanged = prevStatus === "active" && !nowCompleted && targetChanged;
      const highestCrossedForActiveGoal = activeTargetChanged
        ? highestCrossedForActiveGoalEarly
        : null;

      if (goal.trackingMode === "auto" || goal.trackingMode === "both") {
        const { syncGoalsForEmail } = await import("@/app/api/goals/route");
        await syncGoalsForEmail(ownerEmail);

        if (newlyCompleted) {
          const afterSync = await Goal.findById(goal._id).lean() as any;
          if (afterSync) {
            checkAndNotify(ownerEmail, afterSync, prevPercent, {
              force: targetChanged,
            }).catch(() => { });
          }
        }

        if (goalReactivated && highestCrossed !== null) {
          const afterSync = await Goal.findById(goal._id).lean() as any;
          if (afterSync && afterSync.status !== "completed") {
            const user = await User.findOne({ email: ownerEmail })
              .select("currency").lean() as any;
            notifyGoalMilestone(ownerEmail, {
              title: afterSync.title,
              percent: highestCrossed,
              currentAmount: afterSync.currentAmount,
              currency: user?.currency || afterSync.currency || "USD",
            }).catch(() => { });
          }
        }

        if (activeTargetChanged && highestCrossedForActiveGoal !== null) {
          const afterSync = await Goal.findById(goal._id).lean() as any;
          if (afterSync && afterSync.status !== "completed") {
            const user = await User.findOne({ email: ownerEmail })
              .select("currency").lean() as any;

            const newNotifiedMilestones = [25, 50, 75].filter(
              m => m <= highestCrossedForActiveGoal
            );

            await Goal.updateOne(
              { _id: goal._id },
              { $set: { notifiedMilestones: newNotifiedMilestones } }
            );

            notifyGoalMilestone(ownerEmail, {
              title: afterSync.title,
              percent: highestCrossedForActiveGoal,
              currentAmount: afterSync.currentAmount,
              currency: user?.currency || afterSync.currency || "USD",
            }).catch(() => { });
          }
        }
      } else {
        if (newlyCompleted) {
          checkAndNotify(ownerEmail, goal, prevPercent, {
            force: targetChanged,
          }).catch(() => { });
        }

        if (goalReactivated && highestCrossed !== null && goal.status !== "completed") {
          const user = await User.findOne({ email: ownerEmail })
            .select("currency").lean() as any;
          notifyGoalMilestone(ownerEmail, {
            title: goal.title,
            percent: highestCrossed,
            currentAmount: goal.currentAmount,
            currency: user?.currency || goal.currency || "USD",
          }).catch(() => { });
        }

        if (activeTargetChanged && highestCrossedForActiveGoal !== null) {
          const user = await User.findOne({ email: ownerEmail })
            .select("currency").lean() as any;

          const newNotifiedMilestones = [25, 50, 75].filter(
            m => m <= highestCrossedForActiveGoal
          );

          await Goal.updateOne(
            { _id: goal._id },
            { $set: { notifiedMilestones: newNotifiedMilestones } }
          );

          notifyGoalMilestone(ownerEmail, {
            title: goal.title,
            percent: highestCrossedForActiveGoal,
            currentAmount: goal.currentAmount,
            currency: user?.currency || goal.currency || "USD",
          }).catch(() => { });
        }
      }

      const updated = await Goal.findById(goal._id).lean();
      return NextResponse.json({
        success: true,
        message: "Goal updated successfully",
        goal: { ...(updated as any), _id: (updated as any)._id.toString() },
      });
    }

    if (action === "contribute") {
      const { amount, note } = body;

      if (!amount || Number(amount) <= 0) {
        return NextResponse.json(
          { error: "Contribution amount must be positive" },
          { status: 400 }
        );
      }
      if (goal.status === "completed") {
        return NextResponse.json(
          { error: "This goal is already completed" },
          { status: 400 }
        );
      }
      if (goal.trackingMode === "auto") {
        return NextResponse.json(
          {
            error:
              "This goal uses automatic tracking. Switch to 'Both' mode to also allow manual contributions.",
          },
          { status: 400 }
        );
      }

      const prevPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

      goal.contributions.push({
        amount: Number(amount),
        note: note?.trim() || "",
        date: new Date(),
        source: "manual",
      } as any);

      goal.currentAmount = Math.min(
        goal.targetAmount,
        goal.currentAmount + Number(amount)
      );

      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = "completed";
      }

      await goal.save();

      checkAndNotify(ownerEmail, goal, prevPercent).catch(() => { });

      return NextResponse.json({
        success: true,
        message: "Contribution added!",
        goal: { ...goal.toObject(), _id: goal._id.toString() },
      });
    }

    if (action === "updateStatus") {
      const { status } = body;
      if (!["active", "completed", "paused"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const prevPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;
      const prevStatus = goal.status;

      goal.status = status;
      await goal.save();

      if (prevStatus !== "completed" && status === "completed") {
        checkAndNotify(ownerEmail, goal, prevPercent).catch(() => { });
      }

      return NextResponse.json({
        success: true,
        message: `Goal marked as ${status}`,
        goal: { ...goal.toObject(), _id: goal._id.toString() },
      });
    }

    if (action === "resync") {
      if (goal.trackingMode === "manual") {
        return NextResponse.json(
          { error: "This goal uses manual tracking only" },
          { status: 400 }
        );
      }

      if (goal.status === "completed") {
        const current = await Goal.findById(goal._id).lean();
        return NextResponse.json({
          success: true,
          message: "Goal already completed — all transactions are accounted for",
          goal: { ...(current as any), _id: (current as any)._id.toString() },
        });
      }

      const prevPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

      goal.autoSyncedTxIds = [];
      goal.contributions = goal.contributions.filter(
        (c: any) => c.source !== "auto"
      ) as any;
      goal.currentAmount = goal.contributions.reduce(
        (sum: number, c: any) => sum + c.amount,
        0
      );

      const percentAfterClear = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

      goal.notifiedMilestones = (goal.notifiedMilestones || []).filter(
        (m: number) => percentAfterClear >= m
      );

      await goal.save();

      const { syncGoalsForEmail } = await import("@/app/api/goals/route");
      await syncGoalsForEmail(ownerEmail);

      const updated = await Goal.findById(goal._id).lean();

      if (updated) {
        const updatedPercent = (updated as any).targetAmount > 0
          ? Math.round(
            ((updated as any).currentAmount / (updated as any).targetAmount) * 100
          )
          : 0;
        if (prevPercent < 100 && updatedPercent >= 100) {
          checkAndNotify(ownerEmail, updated, prevPercent).catch(() => { });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Goal re-synced with transactions",
        goal: { ...(updated as any), _id: (updated as any)._id.toString() },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[PUT /api/goals/[id]]", error);
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map((e: any) => e.message)[0];
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
    }

    await connectDB();

    const deleted = await Goal.findOneAndDelete({
      _id: id,
      ownerEmail: session.user.email,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/goals/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}