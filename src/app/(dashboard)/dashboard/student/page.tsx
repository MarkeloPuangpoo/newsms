
import { getStudentStats } from "@/lib/actions/dashboard";
import { BentoGrid } from "@/components/dashboard/BentoGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MessageSquare, Calendar, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function StudentDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

    const stats = await getStudentStats(user!.id);

    // Score Color Logic
    let scoreColor = "text-yellow-500";
    let scoreBg = "bg-yellow-500/10";
    if (stats.behaviorScore >= 80) {
        scoreColor = "text-emerald-500";
        scoreBg = "bg-emerald-500/10";
    } else if (stats.behaviorScore < 50) {
        scoreColor = "text-red-500";
        scoreBg = "bg-red-500/10";
    }

    return (
        <div className="space-y-6">
            <DashboardHeader title={`Hi, ${profile?.full_name?.split(" ")[0]}!`} />

            <BentoGrid>
                {/* Behavior Score - Key Feature */}
                <div className={cn("col-span-1 md:col-span-2 row-span-2 glass-card p-8 rounded-xl flex flex-col items-center justify-center relative overflow-hidden", scoreBg)}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <div className="text-center z-10">
                        <div className="flex items-center justify-center gap-2 mb-2 text-zinc-400 uppercase tracking-widest text-xs font-semibold">
                            <Award className="h-4 w-4" />
                            Behavior Score
                        </div>
                        <div className={cn("text-8xl font-black tracking-tighter", scoreColor)}>
                            {stats.behaviorScore}
                        </div>
                        <p className="text-zinc-400 mt-2">Keep up the good work!</p>
                    </div>
                </div>

                {/* Unread Messages */}
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-400">Messages</h3>
                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">{stats.unreadMessages}</div>
                        <p className="text-xs text-zinc-500 mt-1">Unread messages</p>
                    </div>
                </div>

                {/* Up Next / Schedule */}
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-400">Up Next</h3>
                        <Calendar className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white truncate">History</div>
                        <p className="text-xs text-zinc-500 mt-1">Room 102 • 2:00 PM</p>
                    </div>
                </div>

            </BentoGrid>

            {/* Recent Activity / Logs Placeholder */}
            <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Behavior Logs</h3>
                <div className="text-zinc-500 text-sm">No recent activity.</div>
            </div>

        </div>
    );
}
