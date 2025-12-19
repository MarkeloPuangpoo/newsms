
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
            roles: ["superadmin"],
        },
    ];

    const filteredLinks = links.filter((link) => link.roles.includes(role));

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-background/60 backdrop-blur-xl transition-transform">
            <div className="flex h-full flex-col justify-between px-3 py-4">
                <div>
                    <div className="mb-8 flex items-center px-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 font-bold">S</div>
                        <span className="self-center text-lg font-semibold whitespace-nowrap text-foreground tracking-tight">
                            SMS Pro
                        </span>
                    </div>

                    <ul className="space-y-1 font-medium">
                        {filteredLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "flex items-center rounded-md px-3 py-2 text-sm transition-all duration-200 group",
                                            isActive
                                                ? "bg-indigo-500/15 text-white shadow-sm ring-1 ring-indigo-500/30"
                                                : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4 mr-3 transition-colors", isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200")} />
                                        <span>{link.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="border-t border-white/5 pt-4">
                    {/* User Profile Mini Block */}
                    <div className="flex items-center px-2 mb-4 gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300 font-medium">
                            {role[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate capitalize">{role}</p>
                            <p className="text-xs text-zinc-400 truncate">View Profile</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-3" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
