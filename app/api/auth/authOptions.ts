// app/api/auth/authOptions.ts

import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import speakeasy from "speakeasy";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),

        GitHubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                totpToken: { label: "2FA Code", type: "text" },
                userAgent: { label: "UA", type: "text" },
                ip: { label: "IP", type: "text" },
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email }).select(
                    "+twoFactorSecret"
                );
                if (!user) {
                    throw new Error("No user found with this email");
                }

                if (!user.password) {
                    throw new Error(
                        "No password set for this account. Please use Google or GitHub to sign in, or reset your password first."
                    );
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                if (user.twoFactorEnabled && user.twoFactorSecret) {
                    const token = credentials.totpToken?.replace(/\s/g, "");

                    if (!token) {
                        throw new Error("2FA_REQUIRED");
                    }

                    const totpValid = speakeasy.totp.verify({
                        secret: user.twoFactorSecret,
                        encoding: "base32",
                        token,
                        window: 1,
                    });

                    if (!totpValid) {
                        throw new Error("Invalid authenticator code. Please try again.");
                    }
                }

                user.lastLogin = new Date();
                await user.save();

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image || user.avatar || "",
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (!account) return true;

            if (account.provider === "google" || account.provider === "github") {
                await connectDB();

                if (!user.email) {
                    throw new Error("OAuth provider did not return email");
                }

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    await User.create({
                        name: user.name ?? "User",
                        email: user.email,
                        image: user.image || "",
                        provider: account.provider,
                        lastLogin: new Date(),
                    });
                } else {
                    existingUser.lastLogin = new Date();
                    await existingUser.save();
                }
            }

            return true;
        },

        async jwt({ token, user, account, trigger }) {
            if (user) {
                token.id = (user as any).id;
                token.email = user.email;
                token.image = (user as any).image || "";
            }

            if (account && (account.provider === "google" || account.provider === "github")) {
                token.isOAuthLogin = true;
                try {
                    await connectDB();
                    const { default: UserModel } = await import("@/models/User");
                    const dbUser = await UserModel.findOne({ email: token.email })
                        .select("image avatar")
                        .lean() as any;
                    if (dbUser) {
                        token.image = dbUser.image || dbUser.avatar || token.image || "";
                    }
                } catch { /* silent */ }
            }
            if (trigger === "update" && token.email) {
                try {
                    await connectDB();
                    const { default: UserModel } = await import("@/models/User");
                    const dbUser = await UserModel.findOne({ email: token.email })
                        .select("image avatar")
                        .lean() as any;
                    if (dbUser) {
                        token.image = dbUser.image || dbUser.avatar || token.image || "";
                    }
                } catch { /* silent */ }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).id = token.id;
                (session.user as any).image = token.image || session.user.image || "";
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,
};
