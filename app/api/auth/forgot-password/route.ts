// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/notifications";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(email);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) return false;

    record.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        if (!checkRateLimit(normalizedEmail)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait 15 minutes before trying again." },
                { status: 429 }
            );
        }

        await connectDB();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return NextResponse.json(
                { error: "No account found with this email address. Please check and try again." },
                { status: 404 }
            );
        }

        await User.findOneAndUpdate(
            { email: normalizedEmail, resetPasswordExpires: { $lt: new Date() } },
            { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } }
        );

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.findOneAndUpdate(
            { email: normalizedEmail },
            {
                $set: {
                    resetPasswordToken: token,
                    resetPasswordExpires: expiresAt,
                },
            }
        );

        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

        await sendPasswordResetEmail({
            to: normalizedEmail,
            name: user.name || "User",
            resetUrl,
        });

        return NextResponse.json({
            success: true,
            message: "If an account exists with this email, a reset link has been sent.",
        });

    } catch (error: any) {
        console.error("[POST /api/auth/forgot-password]", error);

        if (error?.code === "EAUTH" || error?.responseCode === 535) {
            return NextResponse.json(
                { error: "Email service configuration error. Please contact support." },
                { status: 500 }
            );
        }
        if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
            return NextResponse.json(
                { error: "Unable to send email right now. Please try again later." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error. Please try again later." },
            { status: 500 }
        );
    }
}