
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role || "student";

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar role={role} />
            <div className="ml-64 w-full p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Top Bar / Breadcrumbs could go here */}
                    {children}
                </div>
            </div>
        </div>
    );
}
