"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { motion, cubicBezier } from "framer-motion";
import Link from "next/link";
import { FaUserPlus, FaGoogle, FaGithub } from "react-icons/fa6";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
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

const registerSchema = z
    .object({
        name: z
            .string()
            .min(4, "Name must be at least 4 characters")
            .max(50, "Name cannot exceed 50 characters")
            .regex(/^[a-zA-Z\s]+$/, "Name can contain only letters and spaces"),

        email: z.string().email("Invalid email address"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password is too long")
            .regex(/[a-z]/, "Must contain a lowercase letter")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number"),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type RegisterForm = z.infer<typeof registerSchema>;


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


function getPasswordStrength(password: string) {
    if (!password) return 0;

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const isLongEnough = password.length >= 8;

    if (hasLetter && !hasNumber && !hasSpecial && !isLongEnough) {
        return 1;
    }

    if (hasLetter && isLongEnough && !hasNumber && !hasSpecial) {
        return 2;
    }

    if (hasLetter && hasNumber && hasSpecial) {
        return 4;
    }

    if (hasLetter && (hasNumber || hasSpecial)) {
        return 3;
    }

    return 0;
}

function getStrengthLabel(strength: number) {
    switch (strength) {
        case 1:
            return { text: "Weak", color: "text-orange-500" };
        case 2:
            return { text: "Fair", color: "text-yellow-500" };
        case 3:
            return { text: "Strong", color: "text-emerald-500" };
        case 4:
            return { text: "Very Strong", color: "text-green-500" };
        default:
            return null;
    }
}


export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch("password", "");

    const strength = getPasswordStrength(password);
    const strengthInfo = getStrengthLabel(strength);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const nameRef = useRef<HTMLInputElement | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);
    const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

    async function onSubmit(data: RegisterForm) {
        if (loading) return;
        setLoading(true);
        setServerError(null);

        const toastId = toast.loading("Creating your account...");

        try {
            await delay(2000);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                const message = result.error || "Registration failed";
                setServerError(message);
                updateToast(toastId, "error", message);
                setLoading(false);
                return;
            }

            updateToast(toastId, "success", "Account created successfully 🎉");

            await delay(1500);

            updateToast(toastId, "loading", "Logging you in...");

            await delay(2000);

            const loginResult = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (loginResult?.error) {
                const message = "Account created, but login failed";
                setServerError(message);
                setLoading(false);
                updateToast(toastId, "error", message);
                return;
            }

            reset({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
            });

            updateToast(toastId, "success", "Login successful 🎉");
            setTimeout(() => {
                router.refresh();
                router.push("/dashboard");
            }, 1200);
        } catch (error) {
            setServerError("Something went wrong. Please try again.");
            updateToast(toastId, "error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reset();
    }, [reset]);

    async function handleSocialLogin(provider: "google" | "github") {
        if (loading) return;

        setLoading(true);
        setServerError(null);

        const toastId = toast.loading("Signing you in...");

        try {
            await delay(1500);
            await signIn(provider, {
                callbackUrl: "/dashboard",
            });
            updateToast(toastId, "success", "Login successful 🎉");

        } catch (err) {
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
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-xl shadow-black/10 dark:shadow-white/10 space-y-8 overflow-hidden">

                <motion.div variants={container} className="p-8 space-y-6">
                    <motion.div variants={fadeUp} className="text-center space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full
                          bg-green-500/15 text-green-500">
                            <FaUserPlus size={28} />
                        </div>
                        <h1 className="text-3xl font-bold">Create your account</h1>
                    </motion.div>

                    <motion.form variants={container} className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        <motion.div variants={fadeUp} className="space-y-1">
                            <label className="text-sm font-medium">Full name</label>
                            <input
                                {...register("name")}
                                ref={(el) => {
                                    register("name").ref(el);
                                    nameRef.current = el;
                                }}
                                onKeyDown={(e) => handleEnter(e, emailRef)}
                                placeholder="John Doe"
                                className="w-full rounded-lg px-4 py-3 text-sm bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:italic"
                            />
                            {errors.name && (
                                <motion.p
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500">
                                    {errors.name.message}
                                </motion.p>
                            )}
                        </motion.div>

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
                                className="w-full rounded-lg px-4 py-3 text-sm bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:italic"
                            />
                            {errors.email && (
                                <motion.p
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500">
                                    {errors.email.message}
                                </motion.p>
                            )}
                        </motion.div>

                        <motion.div variants={fadeUp} className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    {...register("password")}
                                    ref={(el) => {
                                        register("password").ref(el);
                                        passwordRef.current = el;
                                    }}
                                    onKeyDown={(e) => handleEnter(e, confirmPasswordRef)}
                                    className="w-full rounded-lg px-4 py-3 pr-11 text-sm bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:italic"
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                                </button>
                            </div>

                            {password && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-2">
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4].map((i) => {
                                                const isActive = strength >= i;

                                                return (
                                                    <div
                                                        key={i}
                                                        className="relative h-1 w-full rounded bg-gray-300 overflow-hidden">
                                                        <motion.span
                                                            initial={{ scaleX: 0 }}
                                                            animate={{ scaleX: isActive ? 1 : 0 }}
                                                            transition={{ duration: 0.35, ease: "easeOut" }}
                                                            style={{ transformOrigin: "left" }}
                                                            className={`absolute inset-0 rounded ${i === 1
                                                                ? "bg-orange-400"
                                                                : i === 2
                                                                    ? "bg-yellow-400"
                                                                    : i === 3
                                                                        ? "bg-emerald-400"
                                                                        : "bg-green-500"
                                                                }`} />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {
                                            strengthInfo && (
                                                <motion.p
                                                    key={strengthInfo.text}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className={`text-xs font-medium ${strengthInfo.color}`}>
                                                    {strengthInfo.text}
                                                </motion.p>
                                            )
                                        }
                                    </motion.div>
                                </>
                            )}

                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                <li>• At least 8 characters</li>
                                <li>• Must include uppercase, lowercase & number</li>
                                <li>• Special character makes it stronger (optional)</li>
                            </ul>

                            {password && strength < 3 && (
                                <motion.p
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-orange-500 text-center">
                                    Password must be at least Strong
                                </motion.p>
                            )}

                            {errors.password && (
                                <motion.p
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500">
                                    {errors.password.message}
                                </motion.p>
                            )}

                        </motion.div>

                        <motion.div variants={fadeUp} className="space-y-1">
                            <label className="text-sm font-medium">Confirm password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    {...register("confirmPassword")}
                                    ref={(el) => {
                                        register("confirmPassword").ref(el);
                                        confirmPasswordRef.current = el;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSubmit(onSubmit)();
                                        }
                                    }}
                                    className="w-full rounded-lg px-4 py-3 pr-11 text-sm bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:italic"
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle confirm password visibility"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                                    {showConfirmPassword ? (
                                        <AiOutlineEyeInvisible />
                                    ) : (
                                        <AiOutlineEye />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <motion.p
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500">
                                    {errors.confirmPassword.message}
                                </motion.p>
                            )}
                        </motion.div>

                        <motion.button
                            variants={fadeUp}
                            type="submit"
                            disabled={strength < 3 || loading}
                            aria-busy={loading}
                            className={`w-full mt-2 rounded-lg text-black font-semibold py-3 transition-all duration-300 shadow-lg  ${strength < 3 || loading
                                ? "bg-green-400 opacity-60 cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600 hover:shadow-green-500/40 cursor-pointer"
                                }`}>
                            {loading ? "Creating account..." : "Create Account"}
                        </motion.button>
                    </motion.form>

                    {serverError && (
                        <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-sm text-red-500">
                            {serverError}
                        </motion.p>
                    )}

                    <motion.p variants={fadeUp} className="text-center text-xs text-gray-500 dark:text-gray-400">
                        🔒 We never store your password or financial data in plain text
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={container}
                    className="p-8 flex flex-col justify-center gap-4 bg-black/2 dark:bg-white/3">
                    <motion.h3 variants={fadeUp} className="text-xl text-center font-semibold">
                        Or continue with
                    </motion.h3>

                    <motion.button
                        aria-label="Sign up with Google"
                        disabled={loading}
                        variants={fadeUp}
                        onClick={() => handleSocialLogin("google")}
                        className="flex items-center justify-center gap-3 rounded-lg border py-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaGoogle className="text-orange-400" />
                        Sign up with Google
                    </motion.button>

                    <motion.button
                        aria-label="Sign up with GitHub"
                        disabled={loading}
                        variants={fadeUp}
                        onClick={() => handleSocialLogin("github")}
                        className="flex items-center justify-center gap-3 rounded-lg border py-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaGithub className="text-pink-400" />
                        Sign up with GitHub
                    </motion.button>

                    <motion.div variants={fadeUp} className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-green-500 hover:underline font-medium">
                            Login
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>
        </main>
    );
}
