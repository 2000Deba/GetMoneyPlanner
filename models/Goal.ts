// models/Goal.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type GoalType = "savings" | "debt" | "investment" | "custom";
export type GoalStatus = "active" | "completed" | "paused";

export interface IGoalContribution {
  _id?: any;
  amount: number;
  note?: string;
  date: Date;
  source: "manual" | "auto";
  transactionId?: string;
}

export interface IGoal extends Document {
  ownerEmail: string;
  title: string;
  description?: string;
  type: GoalType;
  status: GoalStatus;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: Date | null;
  icon?: string;
  color?: string;
  trackingMode: "manual" | "auto" | "both";
  linkedCategory?: string;
  linkedType?: "income" | "expense";
  autoSyncedTxIds: string[];
  notifiedMilestones: number[];
  lastCompletionNotifiedAt?: Date | null;
  contributions: IGoalContribution[];
  createdAt: Date;
  updatedAt: Date;
}

const ContributionSchema = new Schema<IGoalContribution>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, maxlength: 200, default: "" },
    date: { type: Date, default: () => new Date() },
    source: { type: String, enum: ["manual", "auto"], default: "manual" },
    transactionId: { type: String, default: null },
  },
  { _id: true }
);

const GoalSchema = new Schema<IGoal>(
  {
    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: { type: String, trim: true, maxlength: 500, default: "" },

    type: {
      type: String,
      enum: ["savings", "debt", "investment", "custom"],
      required: true,
      default: "savings",
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },

    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
    deadline: { type: Date, default: undefined },
    icon: { type: String, default: "🎯" },
    color: { type: String, default: "#8b5cf6" },

    trackingMode: { type: String, enum: ["manual", "auto", "both"], default: "manual" },
    linkedCategory: { type: String, default: null },
    linkedType: { type: String, enum: ["income", "expense"], default: "income" },
    autoSyncedTxIds: { type: [String], default: [] },
    notifiedMilestones: { type: [Number], default: [] },
    lastCompletionNotifiedAt: { type: Date, default: undefined },

    contributions: { type: [ContributionSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

GoalSchema.index({ ownerEmail: 1, createdAt: -1 });
GoalSchema.index({ ownerEmail: 1, status: 1 });
GoalSchema.index({ ownerEmail: 1, linkedCategory: 1, trackingMode: 1 });

GoalSchema.pre("save", function () {
  if (this.currentAmount >= this.targetAmount && this.status === "active") {
    this.status = "completed";
  }
});

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

export default Goal;