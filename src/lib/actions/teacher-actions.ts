"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteTeacher(teacherId: string, userId: string) {
    const supabase = await createClient();

    // 1. Verify Admin Access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Unauthorized" };

    // Check if user is superadmin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "superadmin") return { error: "Insufficient permissions" };

    // 2. Setup Admin Client for Auth User deletion
    const supabaseAdmin = createClient();
    // Note: We need the SERVICE_ROLE key for admin.deleteUser, but `createClient` uses the standard way.
    // However, since we are in a Server Action, we might not have direct access to `supabase.auth.admin` unless we use the service role key.
    // Let's create a service client manually here if needed, OR relies on RLS deletions cascading if we delete the profile?
    // Supabase Auth users cannot be deleted via RLS. We MUST use `auth.admin.deleteUser`.
    // Let's instantiate a service client.

    const serviceClient = await import("@supabase/supabase-js").then(mod =>
        mod.createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
    );

    try {
        // Delete from Auth (Cascade should handle public tables if setup, but let's be safe)
        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        revalidatePath("/dashboard/admin/teachers");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateTeacher(teacherId: string, data: { fullName: string; department: string; employeeId: string }) {
    const supabase = await createClient();

    // 1. Update Profile (Name)
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", teacherId); // teacherId is usually the profile_id/user_id

    if (profileError) return { error: profileError.message };

    // 2. Update Teacher Details
    const { error: teacherError } = await supabase
        .from("teachers")
        .update({
            department: data.department,
            employee_id: data.employeeId
        })
        .eq("profile_id", teacherId);

    if (teacherError) return { error: teacherError.message };

    revalidatePath("/dashboard/admin/teachers");
    return { success: true };
}

export async function createTeacher(data: any) {
    // Note: Creating a user usually requires Admin Auth Client to set password properly without signing in.

    const serviceClient = await import("@supabase/supabase-js").then(mod =>
        mod.createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    );

    try {
        const { data: user, error: createError } = await serviceClient.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName,
                role: "teacher",
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.fullName}`
            }
        });

        if (createError) throw createError;
        if (!user.user) throw new Error("Failed to create user");

        // Create Public Teacher Record
        // (Note: Trigger `handle_new_user` creates the Profile, but we need the Teacher record)
        // Wait a bit for trigger? Or just insert.
        // Let's insert directly.

        const { error: teacherError } = await serviceClient
            .from("teachers")
            .upsert({
                profile_id: user.user.id,
                employee_id: data.employeeId,
                department: data.department
            });

        if (teacherError) throw teacherError;

        revalidatePath("/dashboard/admin/teachers");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
