"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Sun, Moon, User, LogOut, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { logoutWithSessionExpiry } from "@/lib/logout";

const publicLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Features", href: "/features" },
];

const privateLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Features", href: "/features" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Transactions", href: "/transactions" },
  { name: "Goals", href: "/goals" },
];

const menuVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: cubicBezier(0.16, 1, 0.3, 1),
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: cubicBezier(0.4, 0, 1, 1),
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: cubicBezier(0.25, 0.1, 0.25, 1),
    },
  }),
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;

  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false); // ← loading state for logout

  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(systemDark ? "dark" : "light");
      const active = saved === "light" || saved === "dark" ? saved : systemDark ? "dark" : "light";

      setTheme(active);
      document.documentElement.classList.toggle("dark", active === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setProfileOpen(false);
    setMenuOpen(false);
    await logoutWithSessionExpiry("/login");
    setLoggingOut(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleGetStarted = () => {
    router.push(isAuthenticated ? "/dashboard" : "/register");
  };

  const navLinks = isAuthenticated ? privateLinks : publicLinks;

  if (status === "loading") return null;

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 px-4 sm:px-6 py-4 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/GetMoneyPlanner.png"
            alt="GetMoneyPlanner"
            className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg object-contain shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = "w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0";
              fallback.innerHTML = '<span style="color:white;font-weight:900;font-size:12px;line-height:1">G</span>';
              target.parentNode?.insertBefore(fallback, target);
            }}
          />
          <span className="text-base sm:text-xl font-bold text-green-500 whitespace-nowrap">
            GetMoneyPlanner
          </span>
        </Link>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 text-sm">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors whitespace-nowrap ${pathname === link.href
                ? "text-green-500 font-semibold"
                : "text-black dark:text-white hover:text-green-500"
                }`}>
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!isAuthenticated && (
            <>
              <Link
                href="/login"
                className="hidden md:block px-4 py-2 rounded-md border border-green-500 text-green-500 font-medium hover:bg-green-500/10 transition-all duration-300">
                Login
              </Link>

              <button
                onClick={handleGetStarted}
                className="hidden md:block bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md font-medium cursor-pointer">
                Get Started
              </button>
            </>
          )}

          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(prev => !prev)}
                className="p-2 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer" aria-label="Open user menu">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User profile"}
                    className="h-8 w-8 rounded-sm object-cover"
                    onError={(e) => {
                      // fallback if image fails
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <User size={18} />
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-3 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-black/10 dark:border-white/10 overflow-hidden">
                    <div className="px-4 py-3 border-b border-black/10 dark:border-white/10">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {session?.user?.name ?? "User"}
                      </p>
                      {session?.user?.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                      <LayoutDashboard size={16} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                      <LogOut size={16} />
                      {loggingOut ? "Logging out…" : "Logout"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            className="lg:hidden relative w-8 h-8 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(prev => !prev);
            }}>
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="absolute top-2 left-1 w-6 h-0.5 bg-current"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="absolute top-4 left-1 w-6 h-0.5 bg-current"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="absolute top-6 left-1 w-6 h-0.5 bg-current"
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="lg:hidden mt-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible">
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition-all duration-200 ${pathname === link.href
                    ? "text-green-500 font-semibold bg-green-500/10"
                    : "text-black dark:text-white hover:text-green-500 hover:bg-green-500/8"
                    }`}>
                  {link.name}
                </Link>
              </motion.div>
            ))}

            {!isAuthenticated ? (
              <>
                <motion.div
                  custom={navLinks.length}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 rounded-md border border-green-500 text-green-500 font-medium hover:bg-green-500/10 transition-all duration-300">
                    Login
                  </Link>
                </motion.div>

                <motion.button
                  custom={navLinks.length + 1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => { setMenuOpen(false); handleGetStarted(); }}
                  className="w-full bg-green-500 text-black py-2 rounded-md font-medium cursor-pointer">
                  Get Started
                </motion.button>
              </>
            ) : (
              <motion.button
                custom={navLinks.length}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full px-4 py-2 rounded-md border border-red-500 text-red-500 font-medium hover:bg-red-500/10 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {loggingOut ? "Logging out…" : "Logout"}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
