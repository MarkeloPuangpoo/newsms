
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // 1. Redirect unauthenticated users to login
    if (!user && !path.startsWith("/login") && !path.startsWith("/auth")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // 2. Role-Based Access Control (RBAC)
    if (user) {
        // We fetch the role from the public.profiles table to be secure and up-to-date
        // Note: optimization - you might rely on user_metadata if you keep it synced
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role || "student"; // Default to student if unknown

        // Admin Routes
        if (path.startsWith("/dashboard/admin") && role !== "superadmin") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Teacher Routes (accessible by Superadmin too usually, or just Teacher)
        // The prompt says: "/dashboard/teacher/* -> Only for teacher & superadmin"
        if (path.startsWith("/dashboard/teacher")) {
            if (role !== "teacher" && role !== "superadmin") {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }

        // Student Routes
        if (path.startsWith("/dashboard/student") && role !== "student") {
            // Maybe allow admin/teacher to view student view? For now strict as per prompt.
            // Prompt: "/dashboard/student/* -> Only for student"
            if (role !== "student") {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }

        // Redirect authenticated users away from login
        if (path.startsWith("/login")) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return supabaseResponse;
}
