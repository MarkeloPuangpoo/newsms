
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
        <div className={cn("glass-card p-6 rounded-xl flex flex-col justify-between hover:bg-white/5 transition-colors", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
                <Icon className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                {trend && (
                    <p className="text-xs text-zinc-500 mt-1">
                        <span className={cn("font-medium", trend.startsWith("+") ? "text-emerald-500" : "text-red-500")}>
                            {trend}
                        </span>{" "}
                        from last month
                    </p>
                )}
            </div>
        </div>
    );
}
