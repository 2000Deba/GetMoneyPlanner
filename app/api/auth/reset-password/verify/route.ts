// app/api/auth/reset-password/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ valid: false });
        }

        await connectDB();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        return NextResponse.json({ valid: !!user });

    } catch (error) {
        console.error("[GET /api/auth/reset-password/verify]", error);
        return NextResponse.json({ valid: false });
    }
}