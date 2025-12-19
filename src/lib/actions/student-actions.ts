"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStudent(data: any) {
    const serviceClient = await import("@supabase/supabase-js").then(mod =>
        mod.createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    );

    try {
        // 1. Create Auth User
        const { data: user, error: createError } = await serviceClient.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName,
                role: "student",
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.fullName}`
            }
        });

        if (createError) throw createError;
        if (!user.user) throw new Error("Failed to create user");

        // 2. Create Student Record
        // Trigger handle_new_user creates the Profile, but we need the Student record
        const { error: studentError } = await serviceClient
            .from("students")
            .upsert({
                profile_id: user.user.id,
                student_code: data.studentCode,
                grade_level: data.gradeLevel,
                class_room: data.classRoom,
                total_behavior_score: 100 // Default score
            });

        if (studentError) throw studentError;

        revalidatePath("/dashboard/admin/students");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateStudent(studentId: string, data: { fullName: string; studentCode: string; gradeLevel: string; classRoom: string }) {
    const supabase = await createClient();

    // 1. Update Profile (Name)
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", studentId);

    if (profileError) return { error: profileError.message };

    // 2. Update Student Details
    const { error: studentError } = await supabase
        .from("students")
        .update({
            student_code: data.studentCode,
            grade_level: data.gradeLevel,
            class_room: data.classRoom
        })
        .eq("profile_id", studentId);

    if (studentError) return { error: studentError.message };

    revalidatePath("/dashboard/admin/students");
    return { success: true };
}

export async function deleteStudent(studentId: string) {
    // Note: Deleting a user requires Service Role to delete from Auth
    const serviceClient = await import("@supabase/supabase-js").then(mod =>
        mod.createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    );

    try {
        // Delete from Auth (Cascade should handle profiles and students tables)
        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(studentId);
        if (deleteError) throw deleteError;

        revalidatePath("/dashboard/admin/students");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
