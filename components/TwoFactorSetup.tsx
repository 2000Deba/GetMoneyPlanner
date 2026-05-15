// components/TwoFactorSetup.tsx

"use client";
import { useState } from "react";
import { Smartphone, Shield, Check, X, Loader2, Copy, CheckCircle2, AlertCircle, QrCode } from "lucide-react";

interface Props {
  enabled: boolean;
  onUpdate: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

const inputCls =
  "w-full bg-gray-100/60 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 px-4 py-2.5 transition-all focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20";

export default function TwoFactorSetup({ enabled, onUpdate, showToast }: Props) {
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "disable">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    try {
      setLoading(true);
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("setup");
      } else {
        showToast("error", data.error || "Failed to generate QR code");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyToken() {
    if (token.length !== 6) { showToast("error", "Enter a 6-digit code"); return; }
    try {
      setLoading(true);
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setStep("idle");
        setToken("");
        onUpdate();
      } else {
        showToast("error", data.error || "Verification failed");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    try {
      setLoading(true);
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", token: disableToken }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setStep("idle");
        setDisableToken("");
        onUpdate();
      } else {
        showToast("error", data.error || "Failed to disable 2FA");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    const tryClipboard = async () => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(secret);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = secret;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    tryClipboard().catch(() => showToast("error", "Could not copy to clipboard"));
  }

  if (step === "idle") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${enabled ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20" : "bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"}`}>
            <Smartphone className={`w-5 h-5 ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Authenticator App</p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 max-w-xs sm:max-w-max leading-relaxed">
              Use Google Authenticator or Authy to generate one-time verification codes on login.
            </p>
            <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full
              ${enabled ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {enabled ? (
          <button onClick={() => setStep("disable")} disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl transition-all shrink-0 cursor-pointer">
            <X className="w-4 h-4" /> Disable 2FA
          </button>
        ) : (
          <button onClick={startSetup} disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Shield className="w-4 h-4 shrink-0" />}
            Enable 2FA
          </button>
        )}
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
            <QrCode className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Set Up Authenticator</p>
            <p className="text-xs text-gray-500 dark:text-slate-500">Step 1 of 2 — Scan QR code</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          {qrCode && (
            <div className="flex justify-center">
              <div className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl inline-block">
                <img src={qrCode} alt="2FA QR Code" className="w-44 h-44" />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Instructions</p>
              <ol className="space-y-1.5 text-sm text-gray-600 dark:text-slate-400">
                <li className="flex gap-2"><span className="text-violet-500 font-bold shrink-0">1.</span> Install Google Authenticator or Authy</li>
                <li className="flex gap-2"><span className="text-violet-500 font-bold shrink-0">2.</span> Scan the QR code above with the app</li>
                <li className="flex gap-2"><span className="text-violet-500 font-bold shrink-0">3.</span> Enter the 6-digit code below to confirm</li>
              </ol>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/40 rounded-xl p-3">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1.5">Or enter manually in the app:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-700 dark:text-slate-300 break-all flex-1">{secret}</code>
                <button onClick={copySecret} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Copy to clipboard">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex gap-3">
          <button onClick={() => setStep("idle")}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={() => setStep("verify")}
            className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            I've scanned it →  Enter Code
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <button onClick={() => setStep("verify")}
            className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            I&apos;ve scanned it → Enter Code
          </button>

          <button onClick={() => setStep("idle")} className="w-full py-2.5 px-4 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Verify Code</p>
            <p className="text-xs text-gray-500 dark:text-slate-500">Step 2 of 2 — Confirm setup</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-slate-400">
          Enter the 6-digit code from your authenticator app to confirm the setup.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">6-Digit Code</label>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000" autoFocus
            className={`${inputCls} text-2xl text-center font-mono tracking-[0.5em]`}
          />
        </div>

        <div className="hidden sm:flex gap-3">
          <button onClick={() => setStep("setup")} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer">
            Back
          </button>
          <button onClick={verifyToken} disabled={loading || token.length < 6}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            Verify & Enable
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <button onClick={verifyToken} disabled={loading || token.length < 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            Verify & Enable
          </button>
          <button onClick={() => setStep("setup")}
            className="w-full py-2 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === "disable") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-red-200 dark:border-red-900/40">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Disable Two-Factor Auth</p>
            <p className="text-xs text-red-500 dark:text-red-400">This will reduce your account security</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-slate-400">
          Enter your current authenticator code to confirm disabling 2FA.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Authenticator Code</label>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            value={disableToken} onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000" autoFocus
            className={`${inputCls} text-2xl text-center font-mono tracking-[0.5em]`}
          />
        </div>

        <div className="hidden sm:flex gap-3">
          <button onClick={() => setStep("idle")} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={disable2FA} disabled={loading || disableToken.length < 6}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
            Disable 2FA
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <button onClick={disable2FA} disabled={loading || disableToken.length < 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
            Disable 2FA
          </button>
          <button onClick={() => setStep("idle")}
            className="w-full py-2 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}