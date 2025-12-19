
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// We use the service role key to bypass RLS and create users
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function GET() {
    try {
        // 0. Create Super Admin
        const { error: adminError } = await supabase.auth.admin.createUser({
            email: "drvvdre@gmail.com",
            password: "0650126523",
            email_confirm: true,
            user_metadata: {
                full_name: "Mr.Pondet",
                role: "superadmin",
                avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
            }
        });

        // If user already exists, ignore error
        if (adminError && !adminError.message.includes("already registered")) {
            throw adminError;
        }

        // 1. Create Teacher
        const { data: teacherUser, error: teacherError } = await supabase.auth.admin.createUser({
            email: "teacher@demo.com",
            password: "password",
            email_confirm: true,
            user_metadata: {
                full_name: "Mr. Sarah Connors",
                role: "teacher",
                avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
            }
        });

        if (teacherError && !teacherError.message.includes("already registered")) {
            throw teacherError;
        }

        // We fetch the teacher ID (either new or existing)
        // Note: if existed, we assume profile exists via trigger. If new, trigger ran.
        // Use select to be safe if 'already registered'
        const { data: { users: teacherUsers } } = await supabase.auth.admin.listUsers();
        const teacherId = teacherUsers.find(u => u.email === "teacher@demo.com")?.id;

        if (!teacherId) throw new Error("Teacher ID not found");

        // Ensure teacher record exists in public.teachers
        const { error: teacherProfileError } = await supabase.from("teachers").upsert({
            profile_id: teacherId,
            department: "Science",
            employee_id: "T-800"
        });
        if (teacherProfileError) throw teacherProfileError;


        // 2. Create Students
        const students = [
            { name: "John Connor", email: "john@demo.com", seed: "John", code: "S-101" },
            { name: "Kyle Reese", email: "kyle@demo.com", seed: "Kyle", code: "S-102" }
        ];

        const studentIds = [];

        for (const s of students) {
            const { error: studentError } = await supabase.auth.admin.createUser({
                email: s.email,
                password: "password",
                email_confirm: true,
                user_metadata: {
                    full_name: s.name,
                    role: "student",
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.seed}`
                }
            });

            // Find ID
            const uid = teacherUsers.find(u => u.email === s.email)?.id;
            if (uid) {
                studentIds.push(uid);
                // Ensure public.students record
                await supabase.from("students").upsert({
                    profile_id: uid,
                    student_code: s.code,
                    grade_level: "10",
                    class_room: "10-A",
                    total_behavior_score: 100 // Reset to 100 on seed
                });
            }
        }


        // 3. Create Courses & Enrollments
        const { data: course, error: courseError } = await supabase.from("courses").insert({
            title: "Advanced Robotics",
            description: "Introduction to AI and machine learning.",
            teacher_id: teacherId
        }).select().single();

        if (course) {
            for (const sid of studentIds) {
                await supabase.from("enrollments").upsert({
                    student_id: sid,
                    course_id: course.id
                });
            }
        }

        // 4. Create Random Behavior Logs
        const reasons = [
            { r: "Helping others", s: 3 },
            { r: "Late to class", s: -1 },
            { r: "Excellent project", s: 5 },
            { r: "Disruptive", s: -3 }
        ];

        for (const sid of studentIds) {
            // Add 3 random logs per student
            for (let i = 0; i < 3; i++) {
                const random = reasons[Math.floor(Math.random() * reasons.length)];
                await supabase.from("behavior_logs").insert({
                    student_id: sid,
                    recorded_by_teacher_id: teacherId,
                    score_change: random.s,
                    reason: random.r
                });
            }
        }

        return NextResponse.json({ success: true, message: "Database seeded successfully!" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
