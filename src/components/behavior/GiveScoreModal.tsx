
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addBehaviorLog } from "@/lib/actions/behavior";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema
const scoreSchema = z.object({
    scoreChange: z.number({ required_error: "Please select a score" }),
    reason: z.string().min(1, "Reason is required"),
});

type ScoreFormValues = z.infer<typeof scoreSchema>;

interface GiveScoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

const PRESETS = [
    { label: "Participation", score: 1, type: "positive" },
    { label: "Helping Others", score: 3, type: "positive" },
    { label: "Excellent Work", score: 5, type: "positive" },
    { label: "Late", score: -1, type: "negative" },
    { label: "Disruptive", score: -3, type: "negative" },
    { label: "No Homework", score: -5, type: "negative" },
];

export function GiveScoreModal({ isOpen, onClose, studentId, studentName }: GiveScoreModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<ScoreFormValues>({
        resolver: zodResolver(scoreSchema),
        defaultValues: {
            scoreChange: 0,
            reason: "",
        },
    });

    const onSubmit = async (data: ScoreFormValues) => {
        setIsLoading(true);
        const res = await addBehaviorLog({
            studentId,
            scoreChange: data.scoreChange,
            reason: data.reason,
        });

        setIsLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`Score updated for ${studentName}`);
            form.reset();
            onClose();
        }
    };

    const handlePresetClick = (preset: typeof PRESETS[0]) => {
        form.setValue("scoreChange", preset.score);
        form.setValue("reason", preset.label);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Give Score to ${studentName}`}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Presets Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => handlePresetClick(preset)}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-sm font-medium",
                                form.watch("reason") === preset.label
                                    ? (preset.type === "positive" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-red-500/20 border-red-500/50 text-red-300")
                                    : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600"
                            )}
                        >
                            <span className={cn("text-lg font-bold mb-1", preset.type === "positive" ? "text-emerald-400" : "text-red-400")}>
                                {preset.score > 0 ? "+" : ""}{preset.score}
                            </span>
                            <span>{preset.label}</span>
                        </button>
                    ))}
                </div>

                {/* Manual Method Fields - Hidden mostly if using presets, but good to show values */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="text-xs text-zinc-500 mb-1 block">Score Value</label>
                            <input
                                type="number"
                                {...form.register("scoreChange", { valueAsNumber: true })}
                                className="w-full bg-black/20 border border-zinc-700 rounded p-2 text-white text-sm"
                            />
                        </div>
                        <div className="w-2/3">
                            <label className="text-xs text-zinc-500 mb-1 block">Reason / Note</label>
                            <input
                                type="text"
                                {...form.register("reason")}
                                placeholder="Custom reason..."
                                className="w-full bg-black/20 border border-zinc-700 rounded p-2 text-white text-sm"
                            />
                        </div>
                    </div>
                    {form.formState.errors.scoreChange && <p className="text-xs text-red-500">{form.formState.errors.scoreChange.message}</p>}
                    {form.formState.errors.reason && <p className="text-xs text-red-500">{form.formState.errors.reason.message}</p>}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Score
                    </button>
                </div>
            </form>
        </Modal>
    );
}
