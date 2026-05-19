// app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json(
                { error: "This reset link is invalid or has expired. Please request a new one." },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 12);

        await User.findOneAndUpdate(
            { _id: user._id },
            {
                $set: {
                    password: hashed,
                    provider: "credentials",
                    sessions: [],
                },
                $unset: {
                    resetPasswordToken: "",
                    resetPasswordExpires: "",
                },
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Password has been reset successfully. You can now log in with your new password.",
        });

    } catch (error) {
        console.error("[POST /api/auth/reset-password]", error);
        return NextResponse.json(
            { error: "Internal server error. Please try again later." },
            { status: 500 }
        );
    }
}