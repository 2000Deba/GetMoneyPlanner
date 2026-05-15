// lib/sessionTracker.ts

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";
import { notifyUnusualActivity } from "@/lib/notifications";

const SESSION_TTL_DAYS = 7;

interface TrackSessionParams {
  email: string;
  userAgent?: string;
  ip?: string;
}

function parseDevice(ua: string): string {
  if (!ua) return "Unknown Device";

  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android.*Mobile/i.test(ua)) return "Android Phone";
  if (/Android/i.test(ua)) return "Android Tablet";

  const os =
    /Windows/i.test(ua) ? "Windows"
      : /Mac OS X/i.test(ua) ? "macOS"
        : /Linux/i.test(ua) ? "Linux"
          : "Unknown OS";

  const browser = /Edg\//i.test(ua) ? "Edge"
    : /Chrome/i.test(ua) ? "Chrome"
      : /Firefox/i.test(ua) ? "Firefox"
        : /Safari/i.test(ua) ? "Safari"
          : "Browser";

  return `${browser} on ${os}`;
}

async function resolveLocation(ip: string): Promise<string> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.") || ip.startsWith("172.") || ip.startsWith("::ffff:127")) {
    return "Local / Development";
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    if (data.city) {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }
  } catch {
  }
  return "Unknown Location";
}

function getExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d.toISOString();
}

export async function trackSession(params: TrackSessionParams): Promise<void> {
  try {
    await connectDB();

    const device = parseDevice(params.userAgent || "");
    const location = await resolveLocation(params.ip || "");
    const now = new Date().toISOString();
    const expiresAt = getExpiresAt();

    const user = await User.findOne({ email: params.email });
    if (!user) return;

    const existing: Array<{
      id: string; device: string; location: string; lastActive: string; expiresAt?: string;
    }> = (user.sessions || []).map((s: any) =>
      typeof s.toObject === "function" ? s.toObject() : { ...s }
    );

    const sameDeviceIdx = existing.findIndex(
      (s) => s.device === device && s.location === location
    );

    let updatedSessions: typeof existing;
    let isNewDevice = false;

    if (sameDeviceIdx !== -1) {
      const updated = { ...existing[sameDeviceIdx], lastActive: now, expiresAt, };
      updatedSessions = [
        updated,
        ...existing.filter((_, i) => i !== sameDeviceIdx),
      ];
    } else {
      isNewDevice = true;
      updatedSessions = [
        { id: uuidv4(), device, location, lastActive: now, expiresAt },
        ...existing,
      ];
    }

    updatedSessions = updatedSessions.slice(0, 10);

    await User.findOneAndUpdate(
      { email: params.email },
      { $set: { sessions: updatedSessions } }
    );

    if (isNewDevice && existing.length > 0) {
      const timeStr = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });

      const showIp = params.ip && params.ip !== "::1" && params.ip !== "127.0.0.1"
        ? params.ip
        : undefined;

      notifyUnusualActivity(params.email, {
        description: `New sign-in detected from ${device} at ${location}.`,
        ip: showIp,
        time: timeStr,
      }).catch(() => { });
    }

  } catch (error) {
    console.error("[SessionTracker.trackSession]", error);
  }
}

export async function refreshSessionExpiry(
  email: string,
  userAgent?: string
): Promise<void> {
  try {
    await connectDB();

    const device = parseDevice(userAgent || "");
    const now = new Date().toISOString();
    const newExpiry = getExpiresAt();

    const user = await User.findOne({ email });
    if (!user) return;

    const sessions: any[] = (user.sessions || []).map((s: any) =>
      typeof s.toObject === "function" ? s.toObject() : { ...s }
    );

    const idx = sessions.findIndex((s) => s.device === device);
    if (idx === -1) return;

    sessions[idx] = { ...sessions[idx], lastActive: now, expiresAt: newExpiry };

    await User.findOneAndUpdate(
      { email },
      { $set: { sessions } }
    );
  } catch (error) {
    console.error("[SessionTracker.refreshSessionExpiry]", error);
  }
}