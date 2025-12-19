"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { toast } from "sonner";
import { Loader2, Save, User, Mail, Shield, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
    id: string;
    email: string; // From auth.users, or logic to fetch
    full_name: string;
    avatar_url: string;
    role: string;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const connection = createClient();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { user } } = await connection.auth.getUser();
                if (!user) return;

                const { data, error } = await connection
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    toast.error("Failed to load profile");
                    return;
                }

                setProfile({
                    ...data,
                    email: user.email || "",
                });
            } catch (error) {
                console.error(error);
                toast.error("Error loading settings");
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setSaving(true);
        try {
            const { error } = await connection
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                })
                .eq("id", profile.id);

            if (error) throw error;
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <DashboardHeader title="Account Settings" description="Manage your profile information" />
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardHeader
                title="Account Settings"
                description="Manage your personal information and preferences"
            />

            <div className="grid gap-6 md:grid-cols-12">
                {/* Profile Card */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="relative mb-4 group">
                            <div className="h-24 w-24 rounded-full overflow-hidden bg-zinc-100 border-2 border-white shadow-md ring-1 ring-zinc-200">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                                        <User className="h-10 w-10" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3 className="font-bold text-zinc-900 text-lg">{profile.full_name || "User"}</h3>
                        <p className="text-zinc-500 text-sm capitalize">{profile.role}</p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-8">
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                            <h3 className="font-semibold text-zinc-900">Profile Information</h3>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <UserCircle className="h-3.5 w-3.5" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="w-full bg-zinc-50 border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Shield className="h-3.5 w-3.5" />
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        disabled
                                        className="w-full bg-zinc-100 border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed capitalize font-medium"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full bg-zinc-100 border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed font-mono"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        Avatar URL
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={profile.avatar_url || ""}
                                            onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                            className="w-full bg-zinc-50 border-zinc-200 rounded-lg pl-3 pr-10 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400 font-mono"
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-400">Public URL of your profile picture.</p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end border-t border-zinc-100 mt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm",
                                        saving && "opacity-70 cursor-wait"
                                    )}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
