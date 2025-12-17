
"use client";

import { useEffect, useState } from "react";
import { getAllStudents, getRecentLogs } from "@/lib/actions/behavior";
import { GiveScoreModal } from "@/components/behavior/GiveScoreModal";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Search, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BehaviorPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            const [allStudents, userRes] = await Promise.all([
                getAllStudents(),
                createClient().auth.getUser()
            ]);
            setStudents(allStudents || []);

            if (userRes.data.user) {
                const logs = await getRecentLogs(userRes.data.user.id);
                setRecentLogs(logs || []);
            }
        };
        loadData();
    }, [isModalOpen]); // Reload logs when modal closes (action performed)

    const filteredStudents = students.filter(s =>
        s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (student: any) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <DashboardHeader title="Behavior Management" description="Award points or record incidents." />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

                {/* Left Col: Student List */}
                <div className="lg:col-span-2 glass-card rounded-xl flex flex-col min-h-0">
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredStudents.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="No students found"
                                description="Try adjusting your search query."
                            />
                        ) : (
                            filteredStudents.map((student) => (
                                <div key={student.profile_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-white">
                                            {student.profiles?.full_name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-white">{student.profiles?.full_name}</h3>
                                            <p className="text-xs text-zinc-500">{student.student_code} • Grade {student.grade_level}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={cn("text-sm font-bold",
                                            student.total_behavior_score >= 80 ? "text-emerald-500" :
                                                student.total_behavior_score < 50 ? "text-red-500" : "text-yellow-500"
                                        )}>
                                            {student.total_behavior_score} pts
                                        </span>
                                        <button
                                            onClick={() => handleOpenModal(student)}
                                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-zinc-200 transition-all"
                                        >
                                            Give Score
                                        </button>
                                    </div>
                                </div>
                            )))}
                    </div>
                </div>

                {/* Right Col: Recent Activity */}
                <div className="glass-card rounded-xl flex flex-col min-h-0">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2">
                        <History className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-sm font-medium text-white">Recent Activity</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {recentLogs.length === 0 ? (
                            <EmptyState
                                icon={History}
                                title="No activity"
                                description="Points awarded will appear here."
                            />
                        ) : (
                            recentLogs.map((log) => (
                                <div key={log.id} className="relative pl-4 border-l border-zinc-800 pb-4 last:pb-0">
                                    <div className={cn("absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-zinc-900", log.score_change > 0 ? "bg-emerald-500" : "bg-red-500")} />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-zinc-300 font-medium">{log.students?.profiles?.full_name}</p>
                                            <p className="text-xs text-zinc-500">{log.reason}</p>
                                        </div>
                                        <span className={cn("text-xs font-bold", log.score_change > 0 ? "text-emerald-500" : "text-red-500")}>
                                            {log.score_change > 0 ? "+" : ""}{log.score_change}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                                </div>
                            )))}
                    </div>
                </div>

            </div>

            {selectedStudent && (
                <GiveScoreModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    studentId={selectedStudent.profile_id}
                    studentName={selectedStudent.profiles?.full_name}
                />
            )}
        </div>
    );
}
