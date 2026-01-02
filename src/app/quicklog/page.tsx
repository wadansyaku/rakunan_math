"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { QuickLogForm } from "@/components/quicklog/form";

export default function QuickLogPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <QuickLogForm />
        </Suspense>
    );
}
