"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Modal } from "@/components/ui/Modal";
import { Search, GraduationCap, Edit, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateGrade } from "@/lib/actions/enrollment-actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Enrollment {
    id: string;
    final_grade: string | null;
    courses: {
        title: string;
        description: string;
    };
    students: {
        student_code: string;
        profiles: {
            full_name: string;
            avatar_url: string | null;
            role: string;
        };
    };
}

export default function AdminGradesPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [newGrade, setNewGrade] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkRoleAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "superadmin") {
                router.push("/dashboard");
                return;
            }

            fetchEnrollments();
        };

        checkRoleAndFetch();
    }, []);

    const fetchEnrollments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("enrollments")
            .select(`
                final_grade,
                student_id,
                course_id,
                courses (
                    title,
                    description
                ),
                students (
                    student_code,
                    profiles (
                        full_name,
                        avatar_url,
                        role
                    )
                )
            `);

        if (error) {
            toast.error("Failed to fetch enrollments");
            console.error("Supabase Error:", JSON.stringify(error, null, 2));
            console.log("Supabase Data:", data);
        } else {
            // @ts-ignore - Supabase types join inference can be tricky
            setEnrollments(data || []);
        }
        setLoading(false);
    };

    const handleUpdateGrade = async () => {
        if (!selectedEnrollment) return;
        setIsSaving(true);

        const res = await updateGrade(selectedEnrollment.id, newGrade);

        if (res.success) {
            toast.success("Grade updated successfully");
            fetchEnrollments(); // Refresh data
            setSelectedEnrollment(null);
        } else {
            toast.error(res.error || "Failed to update grade");
        }
        setIsSaving(false);
    };

    const filteredEnrollments = enrollments.filter(item =>
        item.students.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.courses.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.students.student_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const GRADES = ["A", "B+", "B", "C+", "C", "D", "F", "I", "W"];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardHeader
                title="Grades Management"
                description="Manage and update student grades"
            />

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by student name, code, or course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase text-zinc-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Grade</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading records...
                                    </td>
                                </tr>
                            ) : filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No enrollments found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredEnrollments.map((enrollment) => (
                                    <tr key={`${enrollment.student_id}-${enrollment.course_id}`} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {enrollment.students.profiles.avatar_url ? (
                                                        <img src={enrollment.students.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        enrollment.students.profiles.full_name[0]
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900">{enrollment.students.profiles.full_name}</p>
                                                    <p className="text-xs text-zinc-500 font-mono">{enrollment.students.student_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-zinc-900">{enrollment.courses.title}</p>
                                                <p className="text-xs text-zinc-500 font-mono">{enrollment.courses.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {enrollment.final_grade ? (
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                    enrollment.final_grade.startsWith("A") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        enrollment.final_grade.startsWith("B") ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                                            enrollment.final_grade.startsWith("F") ? "bg-red-50 text-red-700 border-red-200" :
                                                                "bg-zinc-100 text-zinc-700 border-zinc-200"
                                                )}>
                                                    {enrollment.final_grade}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400 italic">Not graded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedEnrollment(enrollment);
                                                    setNewGrade(enrollment.final_grade || "A");
                                                }}
                                                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editing Modal */}
            <Modal
                isOpen={!!selectedEnrollment}
                onClose={() => setSelectedEnrollment(null)}
                title="Edit Grade"
            >
                <div className="space-y-4">
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 mb-4">
                        <p className="text-sm text-zinc-600">Student: <span className="font-semibold text-zinc-900">{selectedEnrollment?.students.profiles.full_name}</span></p>
                        <p className="text-sm text-zinc-600">Course: <span className="font-semibold text-zinc-900">{selectedEnrollment?.courses.title}</span></p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Select Grade</label>
                        <div className="grid grid-cols-4 gap-2">
                            {GRADES.map(grade => (
                                <button
                                    key={grade}
                                    onClick={() => setNewGrade(grade)}
                                    className={cn(
                                        "px-3 py-2 text-sm font-medium rounded-lg border transition-all",
                                        newGrade === grade
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50"
                                    )}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-zinc-500">Or type custom</span>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Custom grade (e.g. 85.5)"
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setSelectedEnrollment(null)}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateGrade}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Grade
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
