// app/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (token?.email) {
        const ua = req.headers.get("user-agent") || "";
        const email = token.email as string;

        const res = NextResponse.next();
        res.headers.set("x-session-email", email);
        res.headers.set("x-session-ua", ua);
        return res;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/goals/:path*", "/api/transactions/:path*", "/api/profile/:path*"],
};