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

type EmployeeReport = {
  id: string;
  emp_id: string;
  first_name: string;
  last_name: string;
  registration_date: string;
  orders_assigned: number;
  orders_completed: number;
  orders_cancelled: number;
};

const dummyEmployeeReports: EmployeeReport[] = [
  {
    id: "1",
    emp_id: "EMP-101",
    first_name: "Amaan",
    last_name: "Shaikh",
    registration_date: "2024-12-05",
    orders_assigned: 24,
    orders_completed: 18,
    orders_cancelled: 3,
  },
  {
    id: "2",
    emp_id: "EMP-102",
    first_name: "John",
    last_name: "Doe",
    registration_date: "2025-01-11",
    orders_assigned: 15,
    orders_completed: 12,
    orders_cancelled: 1,
  },
];

const EmployeeReportPage = () => {
  const [reports] = useState<EmployeeReport[]>(dummyEmployeeReports);

  return (
    <div className="rounded-[10px] border border-stroke p-6 bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      
      {/* PAGE HEADER */}
      <h2 className="text-xl font-semibold mb-6 text-dark dark:text-white">
        Employee Report
      </h2>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 text-dark dark:text-white [&>th]:py-3 text-sm">
            <TableHead>Sr. No.</TableHead>
            <TableHead>EMP ID</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>Order Assigned</TableHead>
            <TableHead>Completed Orders</TableHead>
            <TableHead>Cancel Orders</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {reports.map((emp, index) => (
            <TableRow
              key={emp.id}
              className="border-[#eee] dark:border-dark-3"
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{emp.emp_id}</TableCell>
              <TableCell>{emp.first_name}</TableCell>
              <TableCell>{emp.last_name}</TableCell>
              <TableCell>{emp.registration_date}</TableCell>
              <TableCell>{emp.orders_assigned}</TableCell>
              <TableCell>{emp.orders_completed}</TableCell>
              <TableCell>{emp.orders_cancelled}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {reports.length === 0 && (
        <p className="text-center mt-4 text-gray-500 dark:text-gray-300">
          No records found.
        </p>
      )}
    </div>
  );
};

export default EmployeeReportPage;
