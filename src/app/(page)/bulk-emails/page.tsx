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

import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";

const dummyUsers = [
  { id: "U001", name: "Amaan Shaikh", email: "amaan@gmail.com" },
  { id: "U002", name: "John Doe", email: "john@example.com" },
  { id: "U003", name: "Sarah Miller", email: "sarah@example.com" },
  { id: "U004", name: "David Watson", email: "david@example.com" },
];

export default function BulkEmailPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Toggle user checkbox
  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  // Select All
  const toggleSelectAll = () => {
    if (selectedUsers.length === dummyUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(dummyUsers.map((u) => u.id));
    }
  };

  const handleSendEmail = () => {
    if (!subject.trim() || !message.trim()) {
      alert("Subject and Message are required!");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Please select at least one user.");
      return;
    }

    const recipients = dummyUsers
      .filter((u) => selectedUsers.includes(u.id))
      .map((u) => u.email);

    alert(
      `Email Sent!\n\nSubject: ${subject}\nMessage: ${message}\nTo:\n${recipients.join(
        ", ",
      )}`,
    );
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <h2 className="mb-6 text-xl font-semibold text-dark dark:text-white">
        Bulk Email
      </h2>

      {/* FORM SECTION */}
      <div className="mb-10 grid max-w-2xl grid-cols-1 gap-6">
        <InputGroup
          type="text"
          label="Subject"
          placeholder="Enter email subject"
          value={subject}
          handleChange={(e) => setSubject(e.target.value)}
        />

        <TextAreaGroup
          label="Message"
          placeholder="Enter message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {/* USERS TABLE */}
      <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
        Select Users
      </h3>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm">
            <TableHead>
              <input
                type="checkbox"
                checked={selectedUsers.length === dummyUsers.length}
                onChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {dummyUsers.map((user) => (
            <TableRow
              key={user.id}
              className="border-[#eee] dark:border-dark-3"
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                />
              </TableCell>

              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* SEND BUTTON */}
      <div className="mt-6 flex justify-end">
        <button
          className="rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90"
          onClick={handleSendEmail}
        >
          Send Email
        </button>
      </div>
    </div>
  );
}
