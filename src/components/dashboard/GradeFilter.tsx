"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

export function GradeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentGrade = searchParams.get("grade") || "all";

    const thaiGrades = ["1", "2", "3", "4", "5", "6"];

    const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "all") {
            router.push("?"); // ล้าง filter
        } else {
            router.push(`?grade=${encodeURIComponent(value)}`);
        }
    };

    return (
        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Filter className="h-4 w-4" />
                <span>Grade:</span>
            </div>
            <select
                value={currentGrade}
                onChange={handleGradeChange}
                className="bg-slate-50 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[120px]"
            >
                <option value="all">All Grades</option>
                {thaiGrades.map((g) => (
                    <option key={g} value={g}>
                        Grade {g}
                    </option>
                ))}
            </select>
        </div>
    );
}