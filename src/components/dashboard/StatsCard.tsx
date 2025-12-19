
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
    return (
        <div className={cn("card-elevated p-6 flex flex-col justify-between", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-600" />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                {trend && (
                    <p className="text-sm text-slate-500 mt-2">
                        <span className={cn("font-medium", trend.startsWith("+") ? "text-emerald-600" : "text-red-600")}>
                            {trend}
                        </span>{" "}
                        from last month
                    </p>
                )}
            </div>
        </div>
    );
}
