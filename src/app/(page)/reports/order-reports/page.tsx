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

const dummyOrders = [
  {
    id: 1,
    file_no: "FILE-123",
    tat: "48 hrs",
    order_date: "2025-02-10",
    status: "Completed",
    user_name: "johndoe",
    client_name: "Michael Smith",
    email: "michael@example.com",
    property_address: "123 Palm Street, California",
    remark: "All documents verified.",
    remaining_tat: "0 hrs",
    client_rating: 4,
    completed_date: "2025-02-12",
    client_feedback: "Great service!",
  },
  {
    id: 2,
    file_no: "FILE-547",
    tat: "72 hrs",
    order_date: "2025-02-11",
    status: "In Progress",
    user_name: "sara.k",
    client_name: "David Johnson",
    email: "david@example.com",
    property_address: "780 Ocean Ave, New York",
    remark: "Awaiting additional documents",
    remaining_tat: "24 hrs",
    client_rating: "-",
    completed_date: "-",
    client_feedback: "-",
  },
];

export default function OrderReport() {
  return (
    <div className="rounded-[10px] border border-stroke p-6 bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      {/* HEADER */}
      <h2 className="text-xl font-semibold mb-6 text-dark dark:text-white">
        Order Report
      </h2>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:font-medium">
            <TableHead>Sr. No.</TableHead>
            <TableHead>File#</TableHead>
            <TableHead>TAT</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Property Address</TableHead>
            <TableHead>Backbone Data Solutions Remark</TableHead>
            <TableHead>Remaining TAT</TableHead>
            <TableHead>Client Rating</TableHead>
            <TableHead>Completed Date</TableHead>
            <TableHead>Client Feedback</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {dummyOrders.map((order, index) => (
            <TableRow
              key={order.id}
              className="border-[#eee] dark:border-dark-3 text-sm"
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{order.file_no}</TableCell>
              <TableCell>{order.tat}</TableCell>
              <TableCell>{order.order_date}</TableCell>

              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    order.status === "Completed"
                      ? "bg-green-600"
                      : order.status === "In Progress"
                      ? "bg-blue-600"
                      : "bg-gray-500"
                  }`}
                >
                  {order.status}
                </span>
              </TableCell>

              <TableCell>{order.user_name}</TableCell>
              <TableCell>{order.client_name}</TableCell>
              <TableCell>{order.email}</TableCell>
              <TableCell>{order.property_address}</TableCell>
              <TableCell>{order.remark}</TableCell>
              <TableCell>{order.remaining_tat}</TableCell>
              <TableCell>{order.client_rating}</TableCell>
              <TableCell>{order.completed_date}</TableCell>
              <TableCell>{order.client_feedback}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {dummyOrders.length === 0 && (
        <p className="text-center mt-4 text-gray-500 dark:text-gray-300">
          No orders found.
        </p>
      )}
    </div>
  );
}
