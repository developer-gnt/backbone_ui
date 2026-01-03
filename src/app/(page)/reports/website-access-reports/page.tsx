"use client";

import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type LoginHistory = {
  id: string;
  username: string;
  ip_address: string;
  last_login: string;
  address: string;
};

const dummyLoginData: LoginHistory[] = [
  {
    id: "1",
    username: "Amaan",
    ip_address: "192.168.1.20",
    last_login: "2025-02-10 09:45 AM",
    address: "Mumbai, Maharashtra",
  },
  {
    id: "2",
    username: "John Doe",
    ip_address: "192.168.1.50",
    last_login: "2025-02-11 02:15 PM",
    address: "New York, USA",
  },
];

const LoginHistoryTable = () => {
  const [rows] = useState(dummyLoginData);

  return (
    <div className="rounded-[10px] border border-stroke p-6 bg-white shadow-1 dark:bg-gray-dark dark:border-dark-3">

      <h2 className="text-xl font-semibold mb-6 text-dark dark:text-white">
        Login History
      </h2>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 text-sm text-dark dark:text-white">
            <TableHead>Id</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Last Login Date</TableHead>
            <TableHead>Address</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.username}</TableCell>
              <TableCell>{row.ip_address}</TableCell>
              <TableCell>{row.last_login}</TableCell>
              <TableCell>{row.address}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <p className="text-center mt-4 text-gray-500 dark:text-gray-300">
          No login records found.
        </p>
      )}
    </div>
  );
};

export default LoginHistoryTable;
