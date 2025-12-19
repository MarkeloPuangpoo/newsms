import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { redirect } from "next/navigation";
import { BookOpen, Users, Clock, MoreVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function CoursesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    // Get User Role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role;

    // Fetch Courses based on Role
    let query = supabase.from("courses").select(`
        *,
        teachers (
            profiles (
                full_name,
                avatar_url
            )
        ),
        enrollments (count)
    `);

    if (role === 'teacher') {
        // Teachers see only their courses (or all? Usually their own if managing)
        // For now let's assume they want to see ALL courses but maybe highlight theirs, 
        // OR just theirs. Sidebar says "Courses", implies management.
        // Let's filter by teacher_id property if possible, but teacher_id is on the course table.
        // We need to know the teacher's ID referencing the user.
        // First get teacher record
        const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
        if (teacher) {
            query = query.eq('teacher_id', teacher.id);
        }
    }

    const { data: courses, error } = await query.order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <DashboardHeader
                    title="Courses Management"
                    description="Manage your courses and curriculum."
                />
                {role === 'superadmin' && (
                    <button className="btn-primary flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Course
                    </button>
                )}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!courses || courses.length === 0 ? (
                    <div className="col-span-full">
                        <div className="empty-state bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12">
                            <BookOpen className="empty-state-icon" />
                            <p className="empty-state-title">No courses found</p>
                            <p className="empty-state-description">
                                There are no courses available at the moment.
                            </p>
                        </div>
                    </div>
                ) : (
                    courses.map((course: any) => (
                        <div key={course.id} className="card-elevated hover:shadow-lg transition-all duration-300 group">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mt-1 min-h-[40px]">
                                        {course.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{course.enrollments?.[0]?.count || 0} Students</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Teacher Avatar/Name */}
                                        {course.teachers?.profiles?.avatar_url ? (
                                            <img src={course.teachers.profiles.avatar_url} className="w-5 h-5 rounded-full" alt="" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                {course.teachers?.profiles?.full_name?.charAt(0) || "T"}
                                            </div>
                                        )}
                                        <span className="max-w-[80px] truncate">{course.teachers?.profiles?.full_name || "Unknown"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
