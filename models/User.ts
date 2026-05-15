// models/User.ts

import mongoose, { Schema, Document, Model } from "mongoose";

interface INotifications {
    emailAlerts: boolean;
    pushAlerts: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    transactionAlerts: boolean;
    budgetAlerts: boolean;
    goalAlerts: boolean;
    unusualActivity: boolean;
}

interface IPrivacy {
    profileVisible: boolean;
    dataSharing: boolean;
    analyticsOptIn: boolean;
}

interface ISession {
    id: string;
    device: string;
    location: string;
    lastActive: string;
    expiresAt?: string | null;
}

export interface IUser extends Document {
    name?: string;
    email: string;
    password?: string;
    provider?: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    lastBudgetAlertSentAt?: Date | null;
    lastBudgetAlertType?: "warning" | "exceeded" | null;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    phone?: string;
    bio?: string;
    avatar?: string;
    currency?: string;
    timezone?: string;
    language?: string;
    dateFormat?: string;
    monthlyBudget?: number;
    savingsGoalPercent?: number;
    notifications?: INotifications;
    privacy?: IPrivacy;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string | null;
    sessions?: ISession[];
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String },
        provider: { type: String, default: "credentials" },
        image: { type: String },
        lastLogin: { type: Date, default: null },
        lastBudgetAlertSentAt: { type: Date, default: null },
        lastBudgetAlertType: { type: String, default: null },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        phone: { type: String, default: "" },
        bio: { type: String, default: "", maxlength: 300 },
        avatar: { type: String, default: "" },

        currency: { type: String, default: "USD" },
        timezone: { type: String, default: "UTC" },
        language: { type: String, default: "en" },
        dateFormat: { type: String, default: "MM/DD/YYYY" },
        monthlyBudget: { type: Number, default: 0, min: 0 },
        savingsGoalPercent: { type: Number, default: 20, min: 0, max: 100 },

        notifications: {
            type: new Schema(
                {
                    emailAlerts: { type: Boolean, default: true },
                    pushAlerts: { type: Boolean, default: false },
                    weeklyReport: { type: Boolean, default: true },
                    monthlyReport: { type: Boolean, default: true },
                    transactionAlerts: { type: Boolean, default: true },
                    budgetAlerts: { type: Boolean, default: true },
                    goalAlerts: { type: Boolean, default: true },
                    unusualActivity: { type: Boolean, default: true },
                },
                { _id: false }
            ),
            default: () => ({}),
        },

        privacy: {
            type: new Schema(
                {
                    profileVisible: { type: Boolean, default: false },
                    dataSharing: { type: Boolean, default: false },
                    analyticsOptIn: { type: Boolean, default: true },
                },
                { _id: false }
            ),
            default: () => ({}),
        },

        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: { type: String, default: null, select: false },

        sessions: {
            type: [
                new Schema(
                    {
                        id: { type: String, required: true },
                        device: { type: String, default: "Unknown Device" },
                        location: { type: String, default: "Unknown Location" },
                        lastActive: { type: String, default: "" },
                        expiresAt: { type: String, default: null },
                    },
                    { _id: false }
                ),
            ],
            default: [],
        },
    },
    { timestamps: true }
);

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;