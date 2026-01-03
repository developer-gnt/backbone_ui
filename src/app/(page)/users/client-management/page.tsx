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
import { MailIcon, PauseIcon, TerminateIcon } from "@/components/Layouts/sidebar/icons";

const initialClients = [
  {
    id: "CL001",
    status: "Active",
    select_type: "Regular Appraiser",
    company_name: "Alpha Corp",
    first_name: "John",
    last_name: "Doe",
    email: "john@gmail.com",
    mobile: "9876543210",
    reference_source: "Google",
    address: "NYC",
    city: "New York",
    state: "NY",
    zip: "10001",
    registration_date: "2025-01-01",
    username: "john_user",
    password: "john@123",
  },
];

const ClientManagement = () => {
  const [clients, setClients] = useState(initialClients);

  const updateSelectType = (id: string, newType: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, select_type: newType } : c))
    );
  };

  const handleAction = (id: string, action: string) => {
    alert(`${action} clicked for ID: ${id}`);
  };

  const sendLoginDetails = (client: any) => {
    alert(`Login details sent to ${client.email}`);
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <h2 className="text-xl font-semibold mb-5 text-dark dark:text-white">
        Client Management
      </h2>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm">
            <TableHead>Sr. No.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Select Type</TableHead>
            <TableHead>Send Login</TableHead>
            <TableHead>Company Name</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Reference Source</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Zip Code</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((c, index) => (
            <TableRow key={c.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>

              <TableCell>{c.status}</TableCell>

              <TableCell>
                <div className="relative w-[190px]">
                  <select
                    value={c.select_type}
                    onChange={(e) => updateSelectType(c.id, e.target.value)}
                    className="
                      w-full appearance-none rounded-lg border border-stroke 
                      bg-transparent px-3 py-2 text-sm text-dark dark:text-white
                      dark:border-dark-3 dark:bg-dark-2
                      hover:border-primary
                      focus:border-primary dark:focus:border-primary
                      transition
                    "
                  >
                    <option>Regular Appraiser</option>
                    <option>Staff Appraiser</option>
                    <option>Appraisal Company</option>
                  </select>

                  {/* ARROW ICON */}
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9l6 6 6-6"
                    />
                  </svg>
                </div>
              </TableCell>

              <TableCell>
                <button
                  className="text-primary hover:text-primary/80"
                  onClick={() => sendLoginDetails(c)}
                >
                  <MailIcon className="w-5 h-5" />
                </button>
              </TableCell>

              <TableCell>{c.company_name}</TableCell>
              <TableCell>{c.first_name}</TableCell>
              <TableCell>{c.last_name}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.mobile}</TableCell>
              <TableCell>{c.reference_source}</TableCell>
              <TableCell>{c.address}</TableCell>
              <TableCell>{c.city}</TableCell>
              <TableCell>{c.state}</TableCell>
              <TableCell>{c.zip}</TableCell>
              <TableCell>{c.registration_date}</TableCell>
              <TableCell>{c.username}</TableCell>
              <TableCell>{c.password}</TableCell>

              <TableCell>
                <div className="flex gap-3">
                  <button
                    className="text-yellow-500 hover:text-yellow-600"
                    onClick={() => handleAction(c.id, "Deactivate")}
                  >
                    <PauseIcon />
                  </button>

                  <button
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleAction(c.id, "Terminate")}
                  >
                    <TerminateIcon />
                  </button>

                  <button
                    className="text-gray-600 hover:text-gray-800"
                    onClick={() => handleAction(c.id, "Delete")}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientManagement;
