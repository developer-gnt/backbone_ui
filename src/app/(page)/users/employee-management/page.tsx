"use client";

import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { TrashIcon } from "@/assets/icons";
import AddEmployeeModal, { Employee } from "./AddEmployeeModal";

const dummyEmployees: Employee[] = [
  {
    id: "EMP001",
    system_id: "SYS-1001",
    first_name: "Amaan",
    last_name: "Shaikh",
    email: "amaan@gmail.com",
    mobile: "9876543210",
    address: "Mumbai, India",
    role: "Supervisor",
    status: "Active",
    file_no: "FILE-123",
    registration_date: "2025-01-10",
    password: "Admin@123",
  },
];

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>(dummyEmployees);
  const [openModal, setOpenModal] = useState(false);

  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [...prev, newEmp]);
  };

  return (
    <div className="rounded-[10px] border border-stroke p-6 bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Employee Management
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Add Employee
        </button>
      </div>

      <AddEmployeeModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleAddEmployee}
      />

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm">
            <TableHead>Sr. No.</TableHead>
            <TableHead>System Id</TableHead>
            <TableHead>File#</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Password</TableHead>

            {/* ACTIONS (Moved to end) */}
            <TableHead>Make Active</TableHead>
            <TableHead>Delete</TableHead>
            <TableHead>Documents</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {employees.map((emp, index) => (
            <TableRow key={emp.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{emp.system_id}</TableCell>
              <TableCell>{emp.file_no}</TableCell>
              <TableCell>{emp.first_name}</TableCell>
              <TableCell>{emp.last_name}</TableCell>
              <TableCell>{emp.email}</TableCell>
              <TableCell>{emp.mobile}</TableCell>
              <TableCell>{emp.address}</TableCell>
              <TableCell>{emp.role}</TableCell>
              <TableCell>{emp.status}</TableCell>
              <TableCell>{emp.password}</TableCell>

              {/* ACTION BUTTONS */}
              <TableCell>
                <button className="text-green-600 font-semibold hover:underline">
                  Activate
                </button>
              </TableCell>

              <TableCell>
                <button className="text-red-500 hover:text-red-700">
                  <TrashIcon />
                </button>
              </TableCell>

              <TableCell>
                <button className="text-primary hover:underline">
                  Docs
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {employees.length === 0 && (
        <p className="text-center mt-4 text-gray-500">No employees found.</p>
      )}
    </div>
  );
};

export default EmployeeManagement;
