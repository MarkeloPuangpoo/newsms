
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Calendar,
    MessageSquare,
    Settings,
    LogOut,
    GraduationCap,
    ClipboardList
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SidebarProps = {
    role: "superadmin" | "teacher" | "student";
};

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    const links = [
        // Common
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["superadmin", "teacher", "student"],
        },
        // Admin Only
        {
            name: "Teachers",
            href: "/dashboard/admin/teachers",
            icon: Users,
            roles: ["superadmin"],
        },
        {
            name: "Students",
            href: "/dashboard/admin/students",
            icon: GraduationCap,
            roles: ["superadmin"],
        },
        // Teacher & Admin
        {
            name: "Courses",
            href: "/dashboard/courses",
            icon: BookOpen,
            roles: ["superadmin", "teacher"],
        },
        // Student
        {
            name: "My Grades",
            href: "/dashboard/student/grades",
            icon: ClipboardList,
            roles: ["student"],
        },
        // All
        {
            name: "Schedule",
            href: "/dashboard/schedule",
            icon: Calendar,
            roles: ["superadmin", "teacher", "student"],
        },
        {
            name: "Messages",
            href: "/dashboard/messages",
            icon: MessageSquare,
            roles: ["superadmin", "teacher", "student"],
        },
        {
            name: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            roles: ["superadmin", "teacher", "student"],
        },
    ];

    const filteredLinks = links.filter((link) => link.roles.includes(role));

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 transition-transform">
            <div className="flex h-full flex-col justify-between px-3 py-4">
                <div>
                    {/* Logo Header */}
                    <div className="mb-8 flex items-center px-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mr-3 font-bold text-lg shadow-lg shadow-indigo-600/30">S</div>
                        <span className="self-center text-lg font-semibold whitespace-nowrap text-white tracking-tight">
                            SMS Pro
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <ul className="space-y-1 font-medium">
                        {filteredLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5 mr-3 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                                        <span>{link.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Footer Section */}
                <div className="border-t border-slate-700/50 pt-4">
                    {/* User Profile Mini Block */}
                    <div className="flex items-center px-3 mb-4 gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-600/20 flex items-center justify-center text-sm text-indigo-400 font-medium">
                            {role[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate capitalize">{role}</p>
                            <p className="text-xs text-slate-500 truncate">View Profile</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
