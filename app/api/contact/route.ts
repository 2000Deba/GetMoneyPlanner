// app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import Contact, { IContact } from "@/models/Contact";
import { notifyContactConfirmation, notifyContactAdmin, } from "@/lib/notifications";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, subject, category, message } = body;

        if (!name?.trim() || name.trim().length < 2) {
            return NextResponse.json(
                { error: "Name must be at least 2 characters" },
                { status: 400 }
            );
        }
        if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }
        if (!subject?.trim() || subject.trim().length < 5) {
            return NextResponse.json(
                { error: "Subject must be at least 5 characters" },
                { status: 400 }
            );
        }
        if (!message?.trim() || message.trim().length < 20) {
            return NextResponse.json(
                { error: "Message must be at least 20 characters" },
                { status: 400 }
            );
        }
        if (message.trim().length > 2000) {
            return NextResponse.json(
                { error: "Message cannot exceed 2000 characters" },
                { status: 400 }
            );
        }

        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many messages sent. Please try again in an hour." },
                { status: 429 }
            );
        }

        await connectDB();

        const session = await getServerSession(authOptions);

        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            category: category || "general",
            message: message.trim(),
            userAgent: req.headers.get("user-agent") || "",
            ipAddress: ip,
            userId: (session?.user as any)?.id || null,
            userEmail: session?.user?.email ?? undefined,
        });

        const contactId = (contact as IContact & { _id: any })._id.toString();

        const contactData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            category: category || "general",
            message: message.trim(),
        };

        notifyContactConfirmation(email.trim(), contactData).catch(() => { });

        notifyContactAdmin({
            ...contactData,
            ip,
            isLoggedIn: !!session?.user?.email,
            userName: session?.user?.name || null,
        }).catch(() => { });

        return NextResponse.json(
            {
                success: true,
                message:
                    "Your message has been sent! We'll get back to you within 2 business days.",
                id: contactId,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[POST /api/contact]", error);
        if (error.name === "ValidationError") {
            const msg = Object.values(error.errors).map((e: any) => e.message)[0];
            return NextResponse.json({ error: msg }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to send message. Please try again." },
            { status: 500 }
        );
    }
}