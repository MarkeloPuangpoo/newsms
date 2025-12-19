"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { deleteTeacher, updateTeacher } from "@/lib/actions/teacher-actions";
import { toast } from "sonner";

interface TeacherActionsProps {
    teacher: any;
}

export function TeacherActions({ teacher }: TeacherActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState({
        fullName: teacher.profiles?.full_name || "",
        department: teacher.department || "",
        employeeId: teacher.employee_id || ""
    });

    const handleDelete = async () => {
        setIsPending(true);
        const res = await deleteTeacher(teacher.employee_id, teacher.profile_id); // Assuming profile_id IS user_id
        setIsPending(false);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Teacher deleted successfully");
            setIsDeleteOpen(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        const res = await updateTeacher(teacher.profile_id, formData);
        setIsPending(false);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Teacher updated successfully");
            setIsEditOpen(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={() => setIsEditOpen(true)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => setIsDeleteOpen(true)}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Edit Modal */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Teacher">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Employee ID</label>
                        <input
                            type="text"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Department</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                        >
                            <option value="">Select Department</option>
                            <option value="Science">Science</option>
                            <option value="Math">Math</option>
                            <option value="English">English</option>
                            <option value="History">History</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                        >
                            {isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Teacher">
                <div className="space-y-4">
                    <p className="text-zinc-300">
                        Are you sure you want to delete <span className="text-white font-medium">{teacher.profiles?.full_name}</span>?
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isPending ? "Deleting..." : "Delete Teacher"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
