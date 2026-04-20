"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";

export type EmployeeFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  address: string;
  role: string;
  status: string;
  password: string;
  supervisorId: string;
};

export type SupervisorOption = {
  id: number | string;
  firstname: string;
  lastname: string;
  email: string;
};

const initialForm: EmployeeFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  address: "",
  role: "",
  status: "New",
  password: "",
  supervisorId: "",
};

export default function AddEmployeeModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  supervisors = [],
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void;
  loading?: boolean;
  supervisors?: SupervisorOption[];
}) {
  const [form, setForm] = useState<EmployeeFormValues>(initialForm);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: keyof EmployeeFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.address.trim() ||
      !form.role ||
      !form.status
    ) {
      alert("Please fill all mandatory fields.");
      return;
    }

    if (form.role === "Team Member" && !form.supervisorId) {
      alert("Please select a supervisor for the team member.");
      return;
    }

    await onSubmit({
      ...form,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      password: form.password.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-1 text-lg font-semibold text-dark dark:text-white">
          Add New Employee
        </h3>
        <p className="mb-5 text-sm text-dark-5">
          Match the old employee setup flow in the new design.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputGroup
            type="text"
            label="First Name"
            name="first_name"
            placeholder="Enter first name"
            value={form.first_name}
            handleChange={handleChange}
            required
          />

          <InputGroup
            type="text"
            label="Last Name"
            name="last_name"
            placeholder="Enter last name"
            value={form.last_name}
            handleChange={handleChange}
            required
          />

          <InputGroup
            type="email"
            label="Email"
            name="email"
            placeholder="Enter email address"
            value={form.email}
            handleChange={handleChange}
            required
          />

          <InputGroup
            type="text"
            label="Mobile"
            name="mobile"
            placeholder="Enter mobile number"
            value={form.mobile}
            handleChange={handleChange}
            required
          />
        </div>

        <div className="mt-4">
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Address<span className="ml-1 select-none text-red">*</span>
          </label>
          <textarea
            name="address"
            rows={3}
            value={form.address}
            onChange={handleChange}
            placeholder="Enter employee address"
            className="mt-3 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Role"
            items={[
              { label: "Admin", value: "Admin" },
              { label: "Supervisor", value: "Supervisor" },
              { label: "Team Member", value: "Team Member" },
            ]}
            value={form.role}
            onChange={(value) => handleSelectChange("role", value)}
            placeholder="Select role"
          />

          <Select
            label="Status"
            items={[
              { label: "Active", value: "Active" },
              { label: "New", value: "New" },
              { label: "Pending", value: "Pending" },
              { label: "Terminated", value: "Terminated" },
              { label: "Ex Employee", value: "Ex Employee" },
            ]}
            value={form.status}
            onChange={(value) => handleSelectChange("status", value)}
            placeholder="Select status"
          />

          {form.role === "Team Member" && (
            <div className="md:col-span-2">
              <Select
                label="Supervisor"
                items={supervisors.map((supervisor) => ({
                  value: String(supervisor.id),
                  label: `${supervisor.firstname} ${supervisor.lastname} (${supervisor.email})`,
                }))}
                value={form.supervisorId}
                onChange={(value) => handleSelectChange("supervisorId", value)}
                placeholder={
                  supervisors.length
                    ? "Select supervisor"
                    : "No supervisors available"
                }
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <InputGroup
            type="text"
            label="Password (optional)"
            name="password"
            placeholder="Leave blank to auto-generate"
            value={form.password}
            handleChange={handleChange}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-stroke px-4 py-2 hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Saving..." : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
