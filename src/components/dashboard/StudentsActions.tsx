"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { deleteStudent, updateStudent } from "@/lib/actions/student-actions";
import { toast } from "sonner";

interface StudentsActionsProps {
    student: any;
}

export function StudentsActions({ student }: StudentsActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState({
        fullName: student.profiles?.full_name || "",
        studentCode: student.student_code || "",
        gradeLevel: student.grade_level || "",
        classRoom: student.class_room || ""
    });

    const thaiGrades = ["1", "2", "3", "4", "5", "6"];

    const handleDelete = async () => {
        setIsPending(true);
        const res = await deleteStudent(student.profile_id);
        setIsPending(false);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Student deleted successfully");
            setIsDeleteOpen(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        const res = await updateStudent(student.profile_id, formData);
        setIsPending(false);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Student updated successfully");
            setIsEditOpen(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={() => setIsEditOpen(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit Student"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => setIsDeleteOpen(true)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Student"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Edit Modal */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student">
                <form onSubmit={handleUpdate} className="space-y-4 text-left">
                    <div>
                        <label className="label">Full Name</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Student ID</label>
                        <input
                            type="text"
                            value={formData.studentCode}
                            onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Grade Level</label>
                            <select
                                value={formData.gradeLevel}
                                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="">Select</option>
                                {thaiGrades.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Class Room</label>
                            <input
                                type="text"
                                value={formData.classRoom}
                                onChange={(e) => setFormData({ ...formData, classRoom: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(false)}
                            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn-primary"
                        >
                            {isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Student">
                <div className="space-y-4 text-left">
                    <p className="text-slate-600">
                        Are you sure you want to delete <span className="text-slate-900 font-medium">{student.profiles?.full_name}</span>?
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="btn-danger"
                        >
                            {isPending ? "Deleting..." : "Delete Student"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
