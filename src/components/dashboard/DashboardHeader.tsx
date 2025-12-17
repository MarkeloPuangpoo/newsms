
import { format } from "date-fns";

interface DashboardHeaderProps {
    title: string;
    description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col gap-1 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-zinc-500">
                {description || format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
        </div>
    );
}
