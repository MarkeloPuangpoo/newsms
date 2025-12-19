import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load env vars manually
const envPath = path.resolve(process.cwd(), ".env.local");

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
    console.log("Loading .env.local...");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = envContent.split("\n").reduce((acc, line) => {
        const parts = line.split("=");
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join("=").trim().replace(/"/g, "");
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);

    supabaseUrl = supabaseUrl || envVars["NEXT_PUBLIC_SUPABASE_URL"];
    supabaseServiceKey = supabaseServiceKey || envVars["SUPABASE_SERVICE_ROLE_KEY"];
    supabaseUrl = supabaseUrl || envVars["NEXT_PUBLIC_SUPABASE_URL"];
    supabaseServiceKey = supabaseServiceKey || envVars["SUPABASE_SERVICE_ROLE_KEY"];
    supabaseAnonKey = supabaseAnonKey || envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    if (envVars["DATABASE_URL"]) {
        console.log("DATABASE_URL found in .env.local");
    } else {
        console.log("DATABASE_URL NOT found in .env.local");
    }
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Env Vars:", { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
    process.exit(1);
}

console.log("Testing connection to:", supabaseUrl);

async function run() {
    const adminClient = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Test 0: Check Public Schema
    console.log("\n--- Test 0: Check Public Schema (profiles) ---");
    try {
        const { error: matchError } = await adminClient.from("profiles").select("id").limit(1);
        if (matchError) {
            console.error("Public Schema check failed (profiles table missing?):", matchError);
        } else {
            console.log("Public Schema check passed (profiles table exists).");
        }
    } catch (e: any) {
        console.error("Test 0 Exception:", e);
    }

    try {
        const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) {
            console.error("Admin listUsers failed:", listError);
        } else {
            console.log("Admin listUsers success. User count:", users.users.length);
        }
    } catch (e: any) {
        console.error("Admin client exception:", e);
    }

    const client = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Test 1.5: SignUp (Trigger Test)
    console.log("\n--- Test 1.5: SignUp (Trigger Test) ---");
    const testEmail = `debug_test_${Date.now()}@example.com`;
    try {
        const { data, error } = await client.auth.signUp({
            email: testEmail,
            password: "password123",
            options: {
                data: {
                    full_name: "Debug User",
                    role: "student" // Valid role
                }
            }
        });
        if (error) {
            console.error("SignUp failed:", error);
        } else {
            console.log("SignUp success:", data.user?.id);
            // Cleanup?
        }
    } catch (e: any) {
        console.error("SignUp exception:", e);
    }

    // Test 2: SignIn (Teacher)
    console.log("\n--- Test 2: SignIn (Teacher) ---");


    try {
        const { data, error } = await client.auth.signInWithPassword({
            email: "teacher@demo.com",
            password: "password",
        });

        if (error) {
            console.error("SignIn failed:", error.message);
            console.log("Full Error Object:", JSON.stringify(error, null, 2));
        } else {
            console.log("SignIn success:", data.user?.email);
            console.log("Session ID:", data.session?.user.id);
        }
    } catch (e: any) {
        console.error("SignIn exception:", e.message);
    }
}

run();
