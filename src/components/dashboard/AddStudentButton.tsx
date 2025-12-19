// src/components/dashboard/AddStudentButton.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createStudent } from "@/lib/actions/student-actions";
import { toast } from "sonner";

export function AddStudentButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        studentCode: "",
        gradeLevel: "",
        classRoom: ""
    });

    const thaiGrades = ["1", "2", "3", "4", "5", "6"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        const res = await createStudent(formData);
        setIsPending(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Student created successfully");
            setIsOpen(false);
            setFormData({
                email: "", password: "", fullName: "",
                studentCode: "", gradeLevel: "", classRoom: ""
            });
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
            >
                <Plus className="w-4 h-4" />
                Add New Student
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Student">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="col-span-2">
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="input-field"
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field"
                                placeholder="student@school.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                placeholder="e.g. 50001"
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
                                    {thaiGrades.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Class Room</label>
                                <input
                                    type="text"
                                    value={formData.classRoom}
                                    onChange={(e) => setFormData({ ...formData, classRoom: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g. 1"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                            {isPending ? "Creating..." : "Create Student"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}