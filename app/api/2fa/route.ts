// app/api/2fa/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;

    if (action === "setup") {
      const secret = speakeasy.generateSecret({
        name: `GetMoneyPlanner (${session.user.email})`,
        length: 20,
      });

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { twoFactorSecret: secret.base32, twoFactorEnabled: false } }
      );

      const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return NextResponse.json({
        success: true,
        secret: secret.base32,
        qrCode: qrDataUrl,
        manualCode: secret.base32,
      });
    }

    if (action === "verify") {
      const { token } = body;

      if (!token || token.length !== 6) {
        return NextResponse.json({ error: "Please enter a 6-digit code" }, { status: 400 });
      }

      const user = await User.findOne({ email: session.user.email }).select(
        "+twoFactorSecret"
      );

      if (!user?.twoFactorSecret) {
        return NextResponse.json(
          { error: "Please generate a QR code first" },
          { status: 400 }
        );
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token.replace(/\s/g, ""),
        window: 1,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid code. Please try again." },
          { status: 400 }
        );
      }

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { twoFactorEnabled: true } }
      );

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication enabled successfully!",
      });
    }

    if (action === "disable") {
      const { token } = body;

      const user = await User.findOne({ email: session.user.email }).select(
        "+twoFactorSecret"
      );

      if (!user?.twoFactorSecret) {
        await User.findOneAndUpdate(
          { email: session.user.email },
          { $set: { twoFactorEnabled: false, twoFactorSecret: null } }
        );
        return NextResponse.json({ success: true, message: "2FA disabled" });
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token?.replace(/\s/g, "") || "",
        window: 1,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid authenticator code" },
          { status: 400 }
        );
      }

      await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { twoFactorEnabled: false, twoFactorSecret: null } }
      );

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication disabled.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/2fa]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}