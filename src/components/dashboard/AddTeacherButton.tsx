"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createTeacher } from "@/lib/actions/teacher-actions";
import { toast } from "sonner";

export function AddTeacherButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        employeeId: "",
        department: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        const res = await createTeacher(formData);
        setIsPending(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Teacher created successfully");
            setIsOpen(false);
            setFormData({ email: "", password: "", fullName: "", employeeId: "", department: "" });
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Teacher
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Teacher">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
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
                            <label className="label">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field"
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
                            <label className="label">Employee ID</label>
                            <input
                                type="text"
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Department</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="Science">Science</option>
                                <option value="Math">Math</option>
                                <option value="English">English</option>
                                <option value="History">History</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn-primary"
                        >
                            {isPending ? "Creating..." : "Create Teacher"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
