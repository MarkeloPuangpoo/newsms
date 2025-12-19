
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

export async function sendMessage(content: string, receiverId: string, fileUrl?: string, fileType?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        file_url: fileUrl,
        file_type: fileType,
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

// New import for Admin client
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function deleteChatHistory(contactId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // 1. Check if user is Teacher or Superadmin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role;
    const canDelete = role === "teacher" || role === "superadmin";

    if (!canDelete) {
        return { error: "Permission denied" };
    }

    // 2. Use Service Role to bypass RLS and delete ALL messages between these two
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await adminSupabase
        .from("messages")
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`);

    if (error) {
        console.error("Delete chat error:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/messages");
    return { success: true };
}

export async function getLinkMetadata(url: string) {
    try {
        const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
        const html = await response.text();

        // Simple Regex for OG Tags
        const getMeta = (property: string) => {
            const match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
                || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'));
            return match ? match[1] : null;
        };

        const title = getMeta("og:title") || html.match(/<title>(.*?)<\/title>/i)?.[1];
        const description = getMeta("og:description");
        const image = getMeta("og:image");

        return {
            title,
            description,
            image,
            url
        };
    } catch (error) {
        console.error("Error fetching link metadata:", error);
        return null;
    }
}
