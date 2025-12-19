
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
        <div className={cn("glass-card gradient-border p-6 rounded-xl flex flex-col justify-between hover:bg-white/5 transition-all duration-300 glow-hover", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
                <Icon className="h-5 w-5 text-indigo-400/80" />
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                {trend && (
                    <p className="text-xs text-zinc-400 mt-1">
                        <span className={cn("font-medium", trend.startsWith("+") ? "text-emerald-400" : "text-red-400")}>
                            {trend}
                        </span>{" "}
                        from last month
                    </p>
                )}
            </div>
        </div>
    );
}
