
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role || "student";

    if (role === "superadmin") redirect("/dashboard/admin");
    if (role === "teacher") redirect("/dashboard/teacher");
    if (role === "student") redirect("/dashboard/student");

    return <div>Redirecting...</div>;
}
