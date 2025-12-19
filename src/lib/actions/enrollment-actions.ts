"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateGrade(enrollment: { studentId: string; courseId: string }, grade: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Check if superadmin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "superadmin") {
        return { error: "Permission denied" };
    }

    const { error } = await supabase
        .from("enrollments")
        .update({ final_grade: grade })
        .eq("student_id", enrollment.studentId)
        .eq("course_id", enrollment.courseId);

    if (error) {
        console.error("Error updating grade:", error);
        return { error: "Failed to update grade" };
    }

    revalidatePath("/dashboard/admin/grades");
    return { success: true };
}
