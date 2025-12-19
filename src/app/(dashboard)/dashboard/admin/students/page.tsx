import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";
import { GraduationCap, Eye, MoreVertical, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddStudentButton } from "@/components/dashboard/AddStudentButton";
import { GradeFilter } from "@/components/dashboard/GradeFilter";
import { StudentsActions } from "@/components/dashboard/StudentsActions";

function getScoreColor(score: number) {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
}

export default async function StudentsPage({
    searchParams,
}: {
    searchParams: Promise<{ grade?: string }>;
}) {
    const { grade } = await searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    let query = supabase
        .from("students")
        .select(`*, profiles (full_name, avatar_url)`)
        .order('created_at', { ascending: false });

    if (grade && grade !== "all") {
        query = query.eq('grade_level', grade);
    }

    const { data: students } = await query;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <DashboardHeader
                    title="Students Management"
                    description="View and manage student records and behavior scores."
                />
                <AddStudentButton />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                {/* ใช้ Client Component ที่นี่ */}
                <GradeFilter />
            </div>

            <div className="table-container">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="table-header text-slate-500">
                                <th className="px-6 py-4 font-semibold">Student Name</th>
                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                <th className="px-6 py-4 font-semibold">Grade / Room</th>
                                <th className="px-6 py-4 font-semibold">Behavior Score</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!students || students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                                        <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">No students found</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student: any) => (
                                    <tr key={student.profile_id} className="table-row group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="avatar">
                                                    {student.profiles?.avatar_url ? (
                                                        <img src={student.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-bold text-indigo-600">
                                                            {student.profiles?.full_name?.charAt(0) || "S"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-semibold text-slate-800">{student.profiles?.full_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                {student.student_code}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge-primary">
                                                {student.grade_level ? `${student.grade_level}/${student.class_room || '-'}` : "Unassigned"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border", getScoreColor(student.total_behavior_score || 0))}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full mr-2",
                                                    student.total_behavior_score >= 80 ? "bg-emerald-500" :
                                                        student.total_behavior_score >= 50 ? "bg-amber-500" : "bg-red-500"
                                                )} />
                                                {student.total_behavior_score ?? 0} pts
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <StudentsActions student={student} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}