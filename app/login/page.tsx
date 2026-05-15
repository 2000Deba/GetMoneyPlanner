// app/login/page.tsx
"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { motion, cubicBezier } from "framer-motion";
import Link from "next/link";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaGoogle, FaGithub, FaSignInAlt } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: cubicBezier(0.25, 0.1, 0.25, 1),
        },
    },
};

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
});

type LoginForm = z.infer<typeof loginSchema>;

function handleEnter(
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: RefObject<HTMLInputElement | null>
) {
    if (e.key === "Enter") {
        e.preventDefault();
        nextRef.current?.focus();
    }
}

const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

function updateToast(
    id: string,
    type: "loading" | "success" | "error",
    message: string
) {
    toast[type](message, { id });
}

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [totpToken, setTotpToken] = useState("");
    const pendingCredentials = useRef<{ email: string; password: string } | null>(null);
    const oauthTrackedRef = useRef(false);

    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.email) return;
        if (oauthTrackedRef.current) return;

        const oauthKey = "gmp_oauth_pending";
        const isPendingOAuth = typeof window !== "undefined" && sessionStorage.getItem(oauthKey) === "1";

        if (!isPendingOAuth) {
            return;
        }
        oauthTrackedRef.current = true;
        sessionStorage.removeItem(oauthKey);

        fetch("/api/auth/track-session", { method: "POST" })
            .catch(() => { });
    }, [status, session?.user?.email]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const emailValue = watch("email");
    const passwordValue = watch("password");

    const isDisabled = !emailValue || !passwordValue || loading;

    const emailRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);
    const totpRef = useRef<HTMLInputElement | null>(null);

    async function onSubmit(data: LoginForm) {
        if (loading) return;

        setLoading(true);
        setLoginError(null);

        const toastId = toast.loading("Signing you in...");

        try {
            await delay(1500);

            const loginResult = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
                totpToken: "",
                userAgent: navigator.userAgent,
                ip: "",
            });

            if (loginResult?.error === "2FA_REQUIRED") {
                pendingCredentials.current = { email: data.email, password: data.password };
                toast.dismiss(toastId);
                setRequires2FA(true);
                setLoading(false);
                setTimeout(() => totpRef.current?.focus(), 100);
                return;
            }

            if (loginResult?.error) {
                const message = "Invalid email or password";
                setLoginError(message);
                updateToast(toastId, "error", message);
                setLoading(false);
                return;
            }

            reset({
                email: "",
                password: "",
            });

            updateToast(toastId, "success", "Login successful 🎉");
            setTimeout(() => {
                router.refresh();
                router.push("/dashboard");
            }, 1200);
        } catch (error) {
            setLoginError("Something went wrong. Please try again.");
            updateToast(toastId, "error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function onTotpSubmit() {
        if (loading || totpToken.length !== 6 || !pendingCredentials.current) return;

        setLoading(true);
        setLoginError(null);

        const toastId = toast.loading("Verifying code...");

        try {
            const { email, password } = pendingCredentials.current;

            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
                totpToken: totpToken.trim(),
                userAgent: navigator.userAgent,
                ip: "",
            });

            if (result?.error) {
                setLoginError(result.error);
                updateToast(toastId, "error", result.error);
                setLoading(false);
                return;
            }

            pendingCredentials.current = null;
            reset({ email: "", password: "" });
            updateToast(toastId, "success", "Login successful 🎉");
            setTimeout(() => { router.refresh(); router.push("/dashboard"); }, 1200);

        } catch {
            setLoginError("Something went wrong. Please try again.");
            updateToast(toastId, "error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    function handleBackFromTotp() {
        setRequires2FA(false);
        setTotpToken("");
        setLoginError(null);
        pendingCredentials.current = null;
    }

    useEffect(() => {
        reset();
    }, [reset]);

    async function handleSocialLogin(provider: "google" | "github") {
        if (loading) return;

        setLoading(true);
        setLoginError(null);

        if (typeof window !== "undefined") {
            sessionStorage.setItem("gmp_oauth_pending", "1");
        }

        const toastId = toast.loading("Signing you in...");

        try {
            await signIn(provider, {
                callbackUrl: "/dashboard",
            });

        } catch (err) {
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("gmp_oauth_pending");
            }
            updateToast(toastId, "error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative flex items-center justify-center px-6 py-24">
            <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-xl shadow-black/10 dark:shadow-white/10 overflow-hidden">
                <motion.div
                    variants={container}
                    className="p-8 space-y-6">
                    {!requires2FA && (
                        <>
                            <motion.div variants={fadeUp} className="text-center space-y-3">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                                    <FaSignInAlt size={24} />
                                </div>
                                <h1 className="text-3xl font-bold">Welcome back</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Login to manage your finances securely
                                </p>
                            </motion.div>

                            <motion.form
                                variants={container}
                                className="space-y-5"
                                onSubmit={handleSubmit(onSubmit)}>
                                <motion.div variants={fadeUp} className="space-y-1">
                                    <label className="text-sm font-medium">Email address</label>
                                    <input
                                        {...register("email")}
                                        ref={(el) => {
                                            register("email").ref(el);
                                            emailRef.current = el;
                                        }}
                                        onKeyDown={(e) => handleEnter(e, passwordRef)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-lg px-4 py-3 text-sm bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 placeholder:italic placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400" />
                                    {errors.email && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-xs text-red-500">
                                            {errors.email.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div variants={fadeUp} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Password</label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-green-500 hover:text-green-600 dark:hover:text-green-400 hover:underline font-medium transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            {...register("password")}
                                            ref={(el) => {
                                                register("password").ref(el);
                                                passwordRef.current = el;
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSubmit(onSubmit)();
                                                }
                                            }}
                                            placeholder="Enter your password"
                                            className="w-full rounded-lg px-4 py-3 pr-11 text-sm bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 placeholder:italic placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                                            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Password is case-sensitive
                                    </p>

                                    {errors.password && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-xs text-red-500">
                                            {errors.password.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                {loginError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-red-500">
                                        {loginError}
                                    </motion.p>
                                )}

                                <motion.button
                                    variants={fadeUp}
                                    type="submit"
                                    disabled={isDisabled}
                                    aria-busy={loading}
                                    className={`w-full rounded-lg text-black font-semibold py-3 transition-all duration-300 shadow-lg ${isDisabled
                                        ? "bg-green-400 opacity-60 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600 hover:shadow-green-500/40 cursor-pointer"
                                        }`}>
                                    {loading ? "Logging in..." : "Login"}
                                </motion.button>
                            </motion.form>

                            <motion.p
                                variants={fadeUp}
                                className="text-center text-xs text-gray-500 dark:text-gray-400">
                                🔒 We never store your password in plain text
                            </motion.p>
                        </>
                    )}

                    {requires2FA && (
                        <motion.div
                            key="totp-step"
                            variants={container}
                            initial="hidden"
                            animate="visible"
                            className="space-y-6">

                            <motion.div variants={fadeUp} className="text-center space-y-3">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-500">
                                    <MdSecurity size={28} />
                                </div>
                                <h1 className="text-2xl font-bold">Two-Factor Auth</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </motion.div>

                            <motion.div variants={fadeUp}
                                className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Open <span className="font-semibold text-violet-500">Google Authenticator</span> or{" "}
                                    <span className="font-semibold text-violet-500">Authy</span> and enter the code for{" "}
                                    <span className="font-medium">GetMoneyPlanner</span>
                                </p>
                            </motion.div>

                            <motion.div variants={fadeUp} className="space-y-2">
                                <label className="text-sm font-medium">6-Digit Code</label>
                                <input
                                    ref={totpRef}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={totpToken}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, "");
                                        setTotpToken(v);
                                        if (v.length === 6) {
                                            setTimeout(() => {
                                                setTotpToken(v);
                                            }, 0);
                                        }
                                    }}
                                    onKeyDown={(e) => { if (e.key === "Enter") onTotpSubmit(); }}
                                    placeholder="000000"
                                    className="w-full rounded-lg px-4 py-4 text-3xl text-center font-mono tracking-[0.6em] bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <div className="flex gap-1.5 justify-center mt-2">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div key={i}
                                            className={`h-1 w-8 rounded-full transition-all duration-200 ${i < totpToken.length ? "bg-violet-500" : "bg-gray-200 dark:bg-white/10"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </motion.div>

                            {loginError && (
                                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 text-center">
                                    {loginError}
                                </motion.p>
                            )}

                            <motion.button
                                variants={fadeUp}
                                type="button"
                                onClick={onTotpSubmit}
                                disabled={loading || totpToken.length < 6}
                                className={`w-full rounded-lg font-semibold py-3 transition-all duration-300 shadow-lg ${loading || totpToken.length < 6
                                    ? "bg-violet-400 text-white opacity-60 cursor-not-allowed"
                                    : "bg-violet-600 hover:bg-violet-700 text-white hover:shadow-violet-500/40 cursor-pointer"
                                    }`}>
                                {loading ? "Verifying..." : "Verify & Sign In"}
                            </motion.button>

                            <motion.button
                                variants={fadeUp}
                                type="button"
                                onClick={handleBackFromTotp}
                                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-1 cursor-pointer">
                                ← Back to login
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>

                <motion.div
                    variants={container}
                    className="p-8 flex flex-col justify-center gap-4 bg-black/2 dark:bg-white/3">
                    <motion.h3 variants={fadeUp} className="text-xl text-center font-semibold">
                        Or continue with
                    </motion.h3>

                    <motion.button
                        variants={fadeUp}
                        disabled={loading}
                        onClick={() => handleSocialLogin("google")}
                        className="flex items-center justify-center gap-3 rounded-lg border border-black/10 dark:border-white/10 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaGoogle className="text-orange-400" /> Login with Google
                    </motion.button>

                    <motion.button
                        variants={fadeUp}
                        disabled={loading}
                        onClick={() => handleSocialLogin("github")}
                        className="flex items-center justify-center gap-3 rounded-lg border border-black/10 dark:border-white/10 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaGithub className="text-pink-400" /> Login with GitHub
                    </motion.button>

                    <motion.p
                        variants={fadeUp}
                        className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-green-500 font-medium hover:underline">
                            Create one
                        </Link>
                    </motion.p>

                    {requires2FA && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-center">
                            <p className="text-xs font-semibold text-violet-500">🔐 2FA Verification Active</p>
                            <p className="text-xs text-gray-400 mt-1">Your account has an extra layer of security</p>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </main>
    );
}
