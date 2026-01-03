"use client";

import React, { useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";

export type Employee = {
  id: string;
  system_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  address: string;
  role: string;
  status: string;
  file_no: string;
  registration_date: string;
  password: string;
};

export default function AddEmployeeModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (emp: Employee) => void;
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    address: "",
    role: "",
    status: "",
    password: "",
  });

  if (!open) return null;

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    if (!form.first_name || !form.email || !form.password) {
      alert("Please fill all mandatory fields");
      return;
    }

    onSubmit({
      id: Math.random().toString(36).slice(2),
      system_id: "SYS-" + Math.floor(Math.random() * 9000 + 1000),
      file_no: "FILE-" + Math.floor(Math.random() * 900 + 100),
      registration_date: new Date().toISOString().split("T")[0],
      ...form,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-2 border border-stroke dark:border-dark-3 rounded-lg p-6 shadow-xl w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4 text-dark dark:text-white">
          Add New Employee
        </h3>

        <div className="space-y-4">
          <InputGroup
            type="text"
            label="First Name"
            name="first_name"
            placeholder="Enter first name"
            value={form.first_name}
            handleChange={handleChange}
          />

          <InputGroup
            type="text"
            label="Last Name"
            name="last_name"
            placeholder="Enter last name"
            value={form.last_name}
            handleChange={handleChange}
          />

          <InputGroup
            type="email"
            label="Email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            handleChange={handleChange}
          />

          <InputGroup
            type="text"
            label="Mobile"
            name="mobile"
            placeholder="Enter mobile number"
            value={form.mobile}
            handleChange={handleChange}
          />

          <InputGroup
            type="text"
            label="Address"
            name="address"
            placeholder="Enter address"
            value={form.address}
            handleChange={handleChange}
          />

          <InputGroup
            type="text"
            label="Password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            handleChange={handleChange}
          />

          {/* ROLE */}
          <Select
            label="Role"
            items={[
              { label: "Supervisor", value: "Supervisor" },
              { label: "Team Member", value: "Team Member" },
            ]}
            value={form.role}
            onChange={(value) => handleSelectChange("role", value)}
            placeholder="Select Role"
          />

          {/* STATUS */}
          <Select
            label="Status"
            items={[
              { label: "Active", value: "Active" },
              { label: "New", value: "New" },
              { label: "Terminated", value: "Terminated" },
              { label: "Pending", value: "Pending" },
              { label: "Ex Employee", value: "Ex Employee" },
            ]}
            value={form.status}
            onChange={(value) => handleSelectChange("status", value)}
            placeholder="Select Status"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="rounded-md border border-stroke px-4 py-2 dark:border-dark-3 hover:bg-gray-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
}
