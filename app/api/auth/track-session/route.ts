// app/api/auth/track-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { trackSession } from "@/lib/sessionTracker";

const recentlyTracked = new Set<string>();

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;

        const minuteBucket = Math.floor(Date.now() / (2 * 60 * 1000));
        const trackKey = `${email}:${minuteBucket}`;

        if (recentlyTracked.has(trackKey)) {
            return NextResponse.json({ success: true, cached: true });
        }

        recentlyTracked.add(trackKey);
        setTimeout(() => recentlyTracked.delete(trackKey), 5 * 60 * 1000);

        const userAgent = req.headers.get("user-agent") || "";

        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "";

        await trackSession({
            email,
            userAgent,
            ip,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST /api/auth/track-session]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}