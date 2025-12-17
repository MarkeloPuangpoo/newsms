
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Schema
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            toast.error(error.message);
            setIsLoading(false);
            return;
        }

        toast.success("Welcome back!");
        router.push("/dashboard"); // Middleware will redirect to specific role dashboard
        router.refresh();
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left: Branding / Art */}
            <div className="hidden md:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
                <div className="z-10">
                    <h1 className="text-2xl font-bold tracking-tight">SMS <span className="text-zinc-500">Pro</span></h1>
                </div>
                <div className="z-10 space-y-2">
                    <p className="text-lg font-medium">"Simplicity is the ultimate sophistication."</p>
                    <p className="text-zinc-500 text-sm">Design & Architecture</p>
                </div>

                {/* Abstract Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]" />
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-zinc-950 text-zinc-200">
                <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-2xl font-semibold tracking-tight text-white">Log in to your account</h2>
                        <p className="text-sm text-zinc-500">Enter your credentials below to access the system</p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                Email
                            </label>
                            <input
                                {...form.register("email")}
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                className={cn(
                                    "flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all",
                                    form.formState.errors.email && "border-red-500/50 focus:border-red-500/50"
                                )}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Password
                            </label>
                            <input
                                {...form.register("password")}
                                id="password"
                                type="password"
                                className={cn(
                                    "flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all",
                                    form.formState.errors.password && "border-red-500/50 focus:border-red-500/50"
                                )}
                            />
                            {form.formState.errors.password && (
                                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
              bg-white text-black hover:bg-zinc-200 h-10 px-4 py-2 w-full mt-2"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
