// lib/logout.ts

import { signOut } from "next-auth/react";

export async function logoutWithSessionExpiry(redirectPath = "/login") {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userAgent: navigator.userAgent }),
        });
    } catch {
        console.warn("[logout] Session expiry API failed, proceeding with signOut");
    }

    await signOut({ redirect: false });
    window.location.href = redirectPath;
}