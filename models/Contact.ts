// models/Contact.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type ContactStatus = "new" | "read" | "replied" | "closed";
export type ContactCategory =
    | "general"
    | "bug"
    | "feature"
    | "billing"
    | "privacy"
    | "account"
    | "other";

export interface IContact extends Document {
    name: string;
    email: string;
    subject: string;
    category: ContactCategory;
    message: string;
    status: ContactStatus;
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
    userEmail?: string;
    repliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            maxlength: [200, "Subject cannot exceed 200 characters"],
        },
        category: {
            type: String,
            enum: ["general", "bug", "feature", "billing", "privacy", "account", "other"],
            default: "general",
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxlength: [2000, "Message cannot exceed 2000 characters"],
        },
        status: {
            type: String,
            enum: ["new", "read", "replied", "closed"],
            default: "new",
        },
        userAgent: { type: String, default: "" },
        ipAddress: { type: String, default: "" },
        userId: { type: String, default: null },
        userEmail: { type: String, default: null },
        repliedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ email: 1 });

export const Contact: Model<IContact> =
    mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;