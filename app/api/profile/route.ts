// app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Goal from "@/models/Goal";
import Transaction from "@/models/Transaction";
import { refreshSessionExpiry } from "@/lib/sessionTracker";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ua = req.headers.get("user-agent") || "";
    refreshSessionExpiry(session.user.email, ua).catch(() => { });

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalTransactions = await Transaction.countDocuments({
      ownerEmail: session.user.email,
    });

    const totalGoals = await Goal.countDocuments({ ownerEmail: session.user.email });

    return NextResponse.json({
      success: true,
      user: {
        id: (user as any)._id.toString(),
        name: (user as any).name || "",
        email: (user as any).email || "",
        phone: (user as any).phone || "",
        avatar: (user as any).image || (user as any).avatar || "",
        bio: (user as any).bio || "",
        currency: (user as any).currency || "USD",
        timezone: (user as any).timezone || "UTC",
        language: (user as any).language || "en",
        dateFormat: (user as any).dateFormat || "MM/DD/YYYY",
        monthlyBudget: (user as any).monthlyBudget || 0,
        savingsGoalPercent: (user as any).savingsGoalPercent || 20,
        provider: (user as any).provider || "credentials",
        notifications: {
          emailAlerts: (user as any).notifications?.emailAlerts ?? true,
          pushAlerts: (user as any).notifications?.pushAlerts ?? false,
          weeklyReport: (user as any).notifications?.weeklyReport ?? true,
          monthlyReport: (user as any).notifications?.monthlyReport ?? true,
          transactionAlerts: (user as any).notifications?.transactionAlerts ?? true,
          budgetAlerts: (user as any).notifications?.budgetAlerts ?? true,
          goalAlerts: (user as any).notifications?.goalAlerts ?? true,
          unusualActivity: (user as any).notifications?.unusualActivity ?? true,
        },
        privacy: {
          profileVisible: (user as any).privacy?.profileVisible ?? false,
          dataSharing: (user as any).privacy?.dataSharing ?? false,
          analyticsOptIn: (user as any).privacy?.analyticsOptIn ?? true,
        },
        twoFactorEnabled: (user as any).twoFactorEnabled ?? false,
        sessions: (user as any).sessions || [],
        createdAt: (user as any).createdAt || null,
        lastLogin: (user as any).lastLogin || null,
        stats: {
          totalTransactions,
          totalGoals,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await connectDB();

    if (action === "updateProfile") {
      const { name, phone, bio, avatar } = body;

      if (!name?.trim() || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }

      await User.findOneAndUpdate(
        { email: session.user.email },
        {
          $set: {
            name: name.trim(),
            phone: phone?.trim() || "",
            bio: bio?.trim() || "",
            image: avatar || "",
            avatar: avatar || "",
          },
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      });
    }

    if (action === "updatePreferences") {
      const { currency, timezone, language, dateFormat, monthlyBudget, savingsGoalPercent } =
        body;

      await User.findOneAndUpdate(
        { email: session.user.email },
        {
          $set: {
            currency: currency || "USD",
            timezone: timezone || "UTC",
            language: language || "en",
            dateFormat: dateFormat || "MM/DD/YYYY",
            monthlyBudget: Math.max(0, Number(monthlyBudget) || 0),
            savingsGoalPercent: Math.min(
              100,
              Math.max(0, Number(savingsGoalPercent) || 20)
            ),
          },
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Preferences saved successfully",
      });
    }

    if (action === "updateNotifications") {
      const { notifications } = body;

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { notifications } },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Notification preferences saved",
      });
    }

    if (action === "updatePrivacy") {
      const { privacy } = body;

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { privacy } },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Privacy settings updated",
      });
    }

    if (action === "changePassword") {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const user = await User.findOne({ email: session.user.email }).select(
        "+password"
      );

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.password) {
        return NextResponse.json(
          {
            error:
              "Your account uses Google/GitHub login. Password cannot be changed here.",
          },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const hashed = await bcrypt.hash(newPassword, 12);

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { password: hashed } }
      );

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    if (action === "toggle2FA") {
      const { enabled } = body;

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { twoFactorEnabled: !!enabled } },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: enabled
          ? "Two-factor authentication enabled"
          : "Two-factor authentication disabled",
      });
    }

    if (action === "revokeSession") {
      const { sessionId } = body;

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $pull: { sessions: { id: sessionId } } }
      );

      return NextResponse.json({
        success: true,
        message: "Session revoked successfully",
      });
    }

    if (action === "revokeAllOthers") {
      const { keepSessionId } = body;
      const user = await User.findOne({ email: session.user.email });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const allSessions = user.sessions || [];
      const toKeep = keepSessionId
        ? allSessions.filter((s: any) => s.id === keepSessionId)
        : [];
      const revokedCount = allSessions.length - toKeep.length;

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { sessions: toKeep } }
      );

      return NextResponse.json({
        success: true,
        message: revokedCount > 0
          ? `${revokedCount} session${revokedCount > 1 ? "s" : ""} revoked successfully`
          : "No other sessions to revoke",
      });
    }

    if (action === "exportData") {
      const user = await User.findOne({ email: session.user.email })
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .lean();

      const transactions = await Transaction.find({
        ownerEmail: session.user.email,
      })
        .sort({ date: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: {
          exportedAt: new Date().toISOString(),
          profile: user,
          transactions,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[PUT /api/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { confirmPassword } = await req.json();

    if (!confirmPassword) {
      return NextResponse.json(
        { error: "Password confirmation is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select(
      "+password"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      const isValid = await bcrypt.compare(confirmPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Password is incorrect" },
          { status: 400 }
        );
      }
    }

    await Promise.all([
      User.deleteOne({ email: session.user.email }),
      Transaction.deleteMany({ ownerEmail: session.user.email }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}