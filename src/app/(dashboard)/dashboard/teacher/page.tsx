
import { getTeacherStats } from "@/lib/actions/dashboard";
import { BentoGrid } from "@/components/dashboard/BentoGrid";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Users, Clock, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";

export default async function TeacherDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

    const stats = await getTeacherStats(user!.id);

    // Placeholder for schedule
    const nextClass = {
        course: "Mathematics 101",
        time: "10:00 AM",
        room: "Room 304"
    };

    return (
        <div className="space-y-6">
            <DashboardHeader title={`Good Morning, ${profile?.full_name?.split(" ")[0]}`} />

            <BentoGrid>
                {/* Quick Stats */}
                <StatsCard title="My Students" value={stats.studentCount} icon={Users} />

                {/* Next Class - Hero Card */}
                <div className="md:col-span-2 glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-indigo-300">Up Next</h3>
                            <Clock className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">{nextClass.course}</h2>
                            <p className="text-lg text-zinc-400">{nextClass.time} • {nextClass.room}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Action: Give Behavior Score */}
                <Link href="/dashboard/behavior" className="group glass-card p-6 rounded-xl flex flex-col justify-center items-center text-center hover:bg-white/10 transition-all border-dashed border-zinc-700 hover:border-indigo-500/50 cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <PlusCircle className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Give Score</h3>
                    <p className="text-sm text-zinc-500">Record positive or negative behavior</p>
                </Link>
            </BentoGrid>

            {/* Today's Schedule List Placeholder */}
            <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Today's Schedule</h3>
                <div className="text-zinc-500 text-sm italic">No classes scheduled for today.</div>
            </div>
        </div>
    );
}
