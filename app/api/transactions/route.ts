import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { notifyTransactionAdded } from "@/lib/notifications";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            console.log("❌ Unauthorized - No session");
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        const ownerEmail = session.user.email;

        await connectDB();

        const body = await req.json();

        const { type, amount, category, note, date } = body;

        if (!type || !amount || !category || !date) {
            console.log("❌ Missing required fields");
            return NextResponse.json(
                { error: "Missing required fields: type, amount, category, date" },
                { status: 400 }
            );
        }

        if (!["income", "expense"].includes(type)) {
            console.log("❌ Invalid type:", type);
            return NextResponse.json(
                { error: "Type must be 'income' or 'expense'" },
                { status: 400 }
            );
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            console.log("❌ Invalid amount:", amount);
            return NextResponse.json(
                { error: "Amount must be greater than 0" },
                { status: 400 }
            );
        }

        const transactionData = {
            ownerEmail,
            type,
            amount: numAmount,
            category: category.trim(),
            note: note?.trim() || "",
            date: new Date(date),
        };

        const transaction = await Transaction.create(transactionData);

        User.findOne({ email: ownerEmail })
            .select("currency")
            .lean()
            .then((user: any) => {
                notifyTransactionAdded(ownerEmail, {
                    type: type as "income" | "expense",
                    amount: numAmount,
                    category: (category as string).trim(),
                    currency: (user?.currency as string) || "USD",
                    note: note?.trim() || undefined,
                }).catch(() => { });
            })
            .catch(() => { });

        import("@/app/api/goals/route")
            .then(({ syncGoalsForEmail }) => {
                syncGoalsForEmail(ownerEmail).catch(() => { });
            })
            .catch(() => { });

        return NextResponse.json(
            { success: true, data: transaction },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ Transaction POST error:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json(
                { error: messages.join(', ') },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const ownerEmail = session.user.email;

        await connectDB();

        const { searchParams } = new URL(req.url);

        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 10);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const search = searchParams.get("search");

        const skip = (page - 1) * limit;
        let query: any = { ownerEmail };

        if (startDate || endDate) {
            query.date = {};

            if (startDate && !isNaN(Date.parse(startDate))) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }

            if (endDate && !isNaN(Date.parse(endDate))) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        if (search && search.trim()) {
            query.$or = [
                { category: { $regex: search.trim(), $options: "i" } },
                { note: { $regex: search.trim(), $options: "i" } },
                { type: { $regex: search.trim(), $options: "i" } },
            ];
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Transaction.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: transactions,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("❌ Transaction GET error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const ownerEmail = session.user.email;

        await connectDB();

        const body = await req.json();
        const { _id, type, amount, category, note, date } = body;

        if (!_id) {
            return NextResponse.json(
                { error: "Transaction ID is required" },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (type) updateData.type = type;
        if (amount) updateData.amount = Number(amount);
        if (category) updateData.category = category.trim();
        if (note !== undefined) updateData.note = note.trim();
        if (date) updateData.date = new Date(date);

        const updated = await Transaction.findOneAndUpdate(
            {
                _id,
                ownerEmail
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updated
        });
    } catch (error: any) {
        console.error("❌ Transaction PUT error:", error);
        return NextResponse.json(
            { error: error.message || "Update failed" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const ownerEmail = session.user.email;

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Transaction ID is required" },
                { status: 400 }
            );
        }

        const deleted = await Transaction.findOneAndDelete({
            _id: id,
            ownerEmail,
        });

        if (!deleted) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Transaction deleted successfully"
        });
    } catch (error: any) {
        console.error("❌ Transaction DELETE error:", error);
        return NextResponse.json(
            { error: error.message || "Delete failed" },
            { status: 500 }
        );
    }
}