
import { getAdminStats } from "@/lib/actions/dashboard";
import { BentoGrid } from "@/components/dashboard/BentoGrid";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Users, GraduationCap, BookOpen, TrendingUp, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
    const stats = await getAdminStats();

    return (
        <div className="space-y-6">
            <DashboardHeader title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "Admin"}`} />

            <BentoGrid>
                {/* Top Stats */}
                <StatsCard title="Total Students" value={stats.studentsCount} icon={GraduationCap} trend="+12%" />
                <StatsCard title="Total Teachers" value={stats.teachersCount} icon={Users} trend="+2%" />
                <StatsCard title="Active Courses" value={stats.coursesCount} icon={BookOpen} />

                {/* System Growth - Large placeholder for Chart */}
                <div className="md:col-span-2 md:row-span-2 glass-card p-6 rounded-xl flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">System Growth</h3>
                        <TrendingUp className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-800 rounded-lg bg-black/20">
                        <p className="text-zinc-500 text-sm">Growth Chart Placeholder (Recharts)</p>
                    </div>
                </div>

                {/* Recent Users List */}
                <div className="md:col-span-2 glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-400">Recent Users</h3>
                        <UserPlus className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="space-y-4">
                        {stats.recentUsers.map((u: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                        {u.full_name?.[0] || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{u.full_name}</p>
                                        <p className="text-xs text-zinc-500 capitalize">{u.role}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-600">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                        {stats.recentUsers.length === 0 && (
                            <p className="text-sm text-zinc-500">No users found.</p>
                        )}
                    </div>
                </div>
            </BentoGrid>
        </div>
    );
}
