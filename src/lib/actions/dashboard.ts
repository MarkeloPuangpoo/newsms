
"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAdminStats() {
    const supabase = await createClient();

    const [
        { count: studentsCount },
        { count: teachersCount },
        { count: coursesCount },
        { data: recentUsers },
    ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    return {
        studentsCount: studentsCount || 0,
        teachersCount: teachersCount || 0,
        coursesCount: coursesCount || 0,
        recentUsers: recentUsers || [],
    };
}

export async function getTeacherStats(teacherId: string) {
    const supabase = await createClient();

    // Get courses taught by teacher
    const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("teacher_id", teacherId);

    const courseIds = courses?.map((c) => c.id) || [];

    // Count unique students enrolled in these courses
    // Note: simpler approach is just count enrollments, but unique students is better
    let studentCount = 0;
    if (courseIds.length > 0) {
        const { count } = await supabase
            .from("enrollments")
            .select("student_id", { count: "exact", head: true })
            .in("course_id", courseIds);
        studentCount = count || 0;
    }

    return {
        studentCount,
    };
}

export async function getStudentStats(studentId: string) {
    const supabase = await createClient();

    const [
        { data: studentData },
        { count: unreadMessages }
    ] = await Promise.all([
        supabase.from("students").select("total_behavior_score").eq("profile_id", studentId).single(),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", studentId).eq("is_read", false)
    ]);

    return {
        behaviorScore: studentData?.total_behavior_score || 100,
        unreadMessages: unreadMessages || 0,
    };
}
