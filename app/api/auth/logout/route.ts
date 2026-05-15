// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { userAgent } = body;

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user || !user.sessions?.length) {
            return NextResponse.json({ success: true });
        }

        const device = parseDevice(userAgent || "");
        const past = new Date(0).toISOString();

        const updatedSessions = (user.sessions as any[]).map((s: any) => {
            const sObj = typeof s.toObject === "function" ? s.toObject() : { ...s };
            if (sObj.device === device) {
                return { ...sObj, expiresAt: past };
            }
            return sObj;
        });

        await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: { sessions: updatedSessions } }
        );

        return NextResponse.json({ success: true, message: "Session expired" });
    } catch (error) {
        console.error("[POST /api/auth/logout]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function parseDevice(ua: string): string {
    if (!ua) return "Unknown Device";

    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android.*Mobile/i.test(ua)) return "Android Phone";
    if (/Android/i.test(ua)) return "Android Tablet";

    const os =
        /Windows/i.test(ua) ? "Windows" :
            /Mac OS X/i.test(ua) ? "macOS" :
                /Linux/i.test(ua) ? "Linux" : "Unknown OS";

    const browser =
        /Edg\//i.test(ua) ? "Edge" :
            /Chrome/i.test(ua) ? "Chrome" :
                /Firefox/i.test(ua) ? "Firefox" :
                    /Safari/i.test(ua) ? "Safari" : "Browser";

    return `${browser} on ${os}`;
}