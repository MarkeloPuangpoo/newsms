
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, className, action }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
            <div className="bg-zinc-800/50 p-4 rounded-full mb-4 ring-1 ring-white/5">
                <Icon className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
}
