"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dummyData = [
  {
    file_no: "FILE-001",
    tat: "48 hrs",
    credit: 10,
    order_date: "2025-01-05",
    status: "Pending",
    client_username: "john123",
    client_name: "John Doe",
    assigned: "Agent A",
    remaining_tat: "24 hrs",
    address: "123, Sunset Blvd, LA",
    working_docs: "3 Docs",
    reply: "Waiting",
    accept: false,
    cancel: false,
    instructions: "Call before visit",
    rating: 4,
    feedback: "Good service",
  },
  {
    file_no: "FILE-002",
    tat: "24 hrs",
    credit: 5,
    order_date: "2025-01-06",
    status: "Completed",
    client_username: "sara_k",
    client_name: "Sara Khan",
    assigned: "Agent B",
    remaining_tat: "-",
    address: "78 Broadway Ave, NY",
    working_docs: "5 Docs",
    reply: "Done",
    accept: true,
    cancel: false,
    instructions: "Urgent case",
    rating: 5,
    feedback: "Excellent",
  },
];

const OrdersTable = () => {
  const [data, setData] = useState<any[]>([]);

  const handleGetData = () => {
    // Simulate API call
    setData(dummyData);
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Orders List
        </h2>

        <button
          onClick={handleGetData}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Get Data
        </button>
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:text-dark [&>th]:dark:text-white">

            <TableHead>Sr. No.</TableHead>
            <TableHead>File#</TableHead>
            <TableHead>TAT</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Client Username</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Remaining TAT</TableHead>
            <TableHead>Property Address</TableHead>
            <TableHead>Working Docs</TableHead>
            <TableHead>Reply</TableHead>
            <TableHead>Accept</TableHead>
            <TableHead>Cancel</TableHead>
            <TableHead>Client Instructions</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Feedback</TableHead>

          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className="border-[#eee] dark:border-dark-3">

              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.file_no}</TableCell>
              <TableCell>{row.tat}</TableCell>
              <TableCell>{row.credit}</TableCell>
              <TableCell>{row.order_date}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.client_username}</TableCell>
              <TableCell>{row.client_name}</TableCell>
              <TableCell>{row.assigned}</TableCell>
              <TableCell>{row.remaining_tat}</TableCell>
              <TableCell>{row.address}</TableCell>
              <TableCell>{row.working_docs}</TableCell>
              <TableCell>{row.reply}</TableCell>

              <TableCell>
                {row.accept ? (
                  <span className="text-green-600 font-semibold">Accepted</span>
                ) : (
                  "-"
                )}
              </TableCell>

              <TableCell>
                {row.cancel ? (
                  <span className="text-red-600 font-semibold">Cancelled</span>
                ) : (
                  "-"
                )}
              </TableCell>

              <TableCell>{row.instructions}</TableCell>
              <TableCell>{row.rating}</TableCell>
              <TableCell>{row.feedback}</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* No Data Placeholder */}
      {data.length === 0 && (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
          Click “Get Data” to load orders.
        </p>
      )}
    </div>
  );
};

export default OrdersTable;
