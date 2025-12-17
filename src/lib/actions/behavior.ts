
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBehaviorLog({
    studentId,
    scoreChange,
    reason,
}: {
    studentId: string;
    scoreChange: number;
    reason: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // 1. Insert Log
    const { error } = await supabase.from("behavior_logs").insert({
        student_id: studentId,
        recorded_by_teacher_id: user.id, // Assumes teacher is the one recording
        score_change: scoreChange,
        reason: reason,
    });

    if (error) {
        console.error("Error adding behavior log:", error);
        return { error: "Failed to add behavior log" };
    }

    // 2. Revalidate
    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/teacher/behavior");

    return { success: true };
}

export async function getRecentLogs(teacherId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("behavior_logs")
        .select(`
      *,
      students (
        profile_id,
        profiles (
          full_name
        )
      )
    `)
        .eq("recorded_by_teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching logs:", error);
        return [];
    }

    return data;
}

export async function getAllStudents() {
    const supabase = await createClient();
    // In a real app, this would be filtered by the teacher's classes.
    // For now, we fetch all students to populate the list.
    const { data, error } = await supabase
        .from("students")
        .select(`
            *,
            profiles (
                full_name,
                avatar_url
            )
        `);

    if (error) return [];
    return data;
}
