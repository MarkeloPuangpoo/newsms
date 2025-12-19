import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TeacherActions } from "@/components/dashboard/TeacherActions";
import { AddTeacherButton } from "@/components/dashboard/AddTeacherButton";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeachersPage() {
    const supabase = await createClient();

    // Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    // Fetch Teachers with Profile Data
    const { data: teachers, error } = await supabase
        .from("teachers")
        .select(`
            *,
            profiles (
                full_name,
                avatar_url
            )
        `);

    if (error) {
        console.error("Error fetching teachers:", error);
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex justify-between items-start mb-8">
                <DashboardHeader
                    title="Teachers Management"
                    description="Manage teacher accounts, assign departments, and view details."
                />
                <AddTeacherButton />
            </div>

            <div className="table-container">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="table-header">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Employee ID</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!teachers || teachers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No teachers found. Click "Add Teacher" to create one.
                                    </td>
                                </tr>
                            ) : (
                                teachers.map((teacher: any) => (
                                    <tr key={teacher.profile_id} className="table-row group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="avatar">
                                                    {teacher.profiles?.avatar_url ? (
                                                        <img
                                                            src={teacher.profiles.avatar_url}
                                                            alt={teacher.profiles.full_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-indigo-600">
                                                            {teacher.profiles?.full_name?.charAt(0) || "T"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {teacher.profiles?.full_name || "Unknown Name"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                                {teacher.employee_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge-primary">
                                                {teacher.department || "Unassigned"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <TeacherActions teacher={teacher} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
