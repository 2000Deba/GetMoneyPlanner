import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType = "income" | "expense";

export interface ITransaction extends Document {
    ownerEmail: string;
    type: TransactionType;
    amount: number;
    category: string;
    note?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        ownerEmail: {
            type: String,
            required: [true, "Owner email is required"],
            index: true,
        },

        type: {
            type: String,
            enum:  {
                values: ["income", "expense"],
                message: "Type must be either income or expense"
            },
            required: [true, "Type is required"],
        },

        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than 0"],
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },

        note: {
            type: String,
            trim: true,
            maxlength: [500, "Note cannot exceed 500 characters"],
            default: "",
        },

        date: {
            type: Date,
            required: [true, "Date is required"],
            index: true,
        },
    },
    { timestamps: true, versionKey: false  }
);

TransactionSchema.index({ ownerEmail: 1, date: -1 });

export const Transaction: Model<ITransaction> =
    mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
