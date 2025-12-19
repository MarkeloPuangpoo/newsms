import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";
import { BookOpen, User, GraduationCap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
    title: "My Grades | SMS Pro",
    description: "View your academic performance",
};

export default async function StudentGradesPage() {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }

    // 2. Get Student ID from Profile ID
    const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .single();

    if (studentError || !student) {
        return (
            <div className="space-y-6">
                <DashboardHeader title="My Grades" description="View your academic results" />
                <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200">
                    <div className="h-12 w-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-zinc-900 font-semibold">Student Record Not Found</h3>
                    <p className="text-zinc-500 text-sm mt-1">
                        We couldn't find a student record associated with your account.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Fetch Enrollments with Course & Teacher details
    const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select(`
            final_grade,
            courses (
                title,
                description,
                teachers (
                    profiles (
                        full_name
                    )
                )
            )
        `)
        .eq("student_id", student.id);

    if (error) {
        console.error("Error fetching grades:", error);
    }

    // Helper for Grade Badge Color
    const getGradeColor = (grade: string | null) => {
        if (!grade) return "bg-zinc-100 text-zinc-500 border-zinc-200"; // In Progress
        const numGrade = parseFloat(grade);
        if (isNaN(numGrade)) return "bg-zinc-100 text-zinc-500 border-zinc-200";

        if (numGrade >= 4) return "bg-emerald-100 text-emerald-700 border-emerald-200";
        if (numGrade >= 3) return "bg-indigo-100 text-indigo-700 border-indigo-200";
        if (numGrade >= 2) return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-red-100 text-red-700 border-red-200";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardHeader
                title="My Grades"
                description="Track your academic progress and course performance"
            />

            {!enrollments || enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300">
                    <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-zinc-300" />
                    </div>
                    <h3 className="text-zinc-900 font-semibold mb-1">No Courses Found</h3>
                    <p className="text-zinc-500 text-sm text-center max-w-sm">
                        You haven't enrolled in any courses yet. Once you do, your grades will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {enrollments.map((item: any, idx: number) => {
                        const course = item.courses;
                        const teacherName = course.teachers?.profiles?.full_name || "Unknown Teacher";
                        const grade = item.final_grade;

                        return (
                            <div
                                key={idx}
                                className="group bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold border",
                                        getGradeColor(grade)
                                    )}>
                                        {grade ? `Grade: ${grade}` : "In Progress"}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-mono tracking-wide line-clamp-1">{course.description || "No description"}</p>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                                    <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <User className="h-3.5 w-3.5 text-zinc-400" />
                                    </div>
                                    <p className="text-sm text-zinc-600 truncate">
                                        {teacherName}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
