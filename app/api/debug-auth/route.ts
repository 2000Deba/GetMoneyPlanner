import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        await connectDB();

        const user = await User.findOne({ email }).select("+password +twoFactorSecret");

        if (!user) {
            return NextResponse.json({ step: "FAIL", reason: "No user found" });
        }

        if (!user.password) {
            return NextResponse.json({ step: "FAIL", reason: "No password field", provider: user.provider });
        }

        const isValid = await bcrypt.compare(password, user.password);

        return NextResponse.json({
            step: isValid ? "SUCCESS" : "FAIL",
            reason: isValid ? "Password matches" : "Password mismatch",
            provider: user.provider,
            hasPassword: !!user.password,
            passwordStart: user.password?.substring(0, 10),
        });

    } catch (err: any) {
        return NextResponse.json({ step: "ERROR", reason: err.message });
    }
}