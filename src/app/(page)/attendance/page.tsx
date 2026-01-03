"use client";

import React from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";

const dummyAttendance = [
  {
    id: "A001",
    user_name: "Amaan Shaikh",
    date: "2025-01-12",
    login_time: "09:15",
    logout_time: "17:45",
  },
  {
    id: "A002",
    user_name: "John Doe",
    date: "2025-01-12",
    login_time: "10:00",
    logout_time: "18:30",
  },
  {
    id: "A003",
    user_name: "Sarah Miller",
    date: "2025-01-12",
    login_time: "09:45",
    logout_time: "17:00",
  },
];

// Calculate working hours
function calculateWorkingHours(login: string, logout: string) {
  const [lh, lm] = login.split(":").map(Number);
  const [oh, om] = logout.split(":").map(Number);

  const loginMinutes = lh * 60 + lm;
  const logoutMinutes = oh * 60 + om;

  const diff = logoutMinutes - loginMinutes;

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return `${hours}h ${minutes}m`;
}

export default function AttendancePage() {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <h2 className="text-xl font-semibold mb-6 text-dark dark:text-white">
        Attendance Management
      </h2>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm">
            <TableHead>Sr. No.</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Login Time</TableHead>
            <TableHead>Logout Time</TableHead>
            <TableHead>Working Hour</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {dummyAttendance.map((a, index) => (
            <TableRow key={a.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{a.user_name}</TableCell>
              <TableCell>{a.date}</TableCell>
              <TableCell>{a.login_time}</TableCell>
              <TableCell>{a.logout_time}</TableCell>
              <TableCell>
                {calculateWorkingHours(a.login_time, a.logout_time)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {dummyAttendance.length === 0 && (
        <p className="text-center mt-4 text-gray-500 dark:text-white/60">
          No attendance data found.
        </p>
      )}
    </div>
  );
}
