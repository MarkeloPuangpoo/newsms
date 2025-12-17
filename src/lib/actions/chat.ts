
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getContactList() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // 1. Get my role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role;
    let targetTable = "students"; // Default fallback

    if (role === "student") {
        // Student sees Teachers
        targetTable = "teachers";
    } else {
        // Teacher/Admin sees Students
        // (In a real app, Admin might see everyone, but sticking to prompt logic)
        targetTable = "students";
    }

    // 2. Fetch Contacts from the target table's Profiles
    // We need to join with profiles to get name/avatar
    // Note: The schema logic: `teachers` has `profile_id`, `students` has `profile_id`.
    const { data: contacts, error } = await supabase
        .from(targetTable)
        .select(`
      profile_id,
      profiles!inner (
        id,
        full_name,
        avatar_url,
        role
      )
    `);

    if (error || !contacts) {
        console.error("Error fetching contacts:", error);
        return [];
    }

    // Flatten the structure for easier consumption
    return contacts.map((c: any) => ({
        id: c.profiles.id,
        full_name: c.profiles.full_name,
        avatar_url: c.profiles.avatar_url,
        role: c.profiles.role,
    }));
}

export async function getMessages(otherUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return data;
}

export async function sendMessage(content: string, receiverId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        is_read: false,
    });

    if (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message" };
    }

    // We don't necessarily need to revalidate path if we are using Realtime,
    // but it's good practice for initial load consistency.
    revalidatePath("/dashboard/messages");
    return { success: true };
}
