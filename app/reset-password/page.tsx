// app/reset-password/page.tsx

import { Suspense } from "react";
import ResetPasswordPage from "./ResetPasswordClient";

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        }>
            <ResetPasswordPage />
        </Suspense>
    );
}