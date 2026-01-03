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
    file_no: "ACC-2025-001",
    tat: "24 hrs",
    property_address: "12 Palm Street, California",
    order_date: "2025-01-10",
    status: "Pending",
    client_username: "michael45",
    client_name: "Michael Jordan",
    assigned: "Agent A",
    working_docs: "5 Docs",
    accept: false,
    cancel: false,
    work_status: "Not Started",
  },
  {
    file_no: "ACC-2025-002",
    tat: "48 hrs",
    property_address: "88 Grand Ave, Texas",
    order_date: "2025-01-11",
    status: "Ongoing",
    client_username: "linda_k",
    client_name: "Linda Kapoor",
    assigned: "Agent B",
    working_docs: "2 Docs",
    accept: true,
    cancel: false,
    work_status: "In Progress",
  },
];

const AcceptOrderPage = () => {
  const [list, setList] = useState(dummyData);

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">

      {/* HEADER */}
      <h2 className="mb-5 text-xl font-semibold text-dark dark:text-white">
        Accept Orders
      </h2>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 
            [&>th]:py-3 [&>th]:text-sm [&>th]:text-dark [&>th]:dark:text-white">

            <TableHead>Sr. No.</TableHead>
            <TableHead>File#</TableHead>
            <TableHead>TAT</TableHead>
            <TableHead>Property Address</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Client Username</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Working Docs</TableHead>
            <TableHead>Accept</TableHead>
            <TableHead>Cancel</TableHead>
            <TableHead>Work Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>

          </TableRow>
        </TableHeader>

        <TableBody>
          {list.map((row, index) => (
            <TableRow key={index} className="border-[#eee] dark:border-dark-3">

              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.file_no}</TableCell>
              <TableCell>{row.tat}</TableCell>
              <TableCell>{row.property_address}</TableCell>
              <TableCell>{row.order_date}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.client_username}</TableCell>
              <TableCell>{row.client_name}</TableCell>
              <TableCell>{row.assigned}</TableCell>
              <TableCell>{row.working_docs}</TableCell>

              {/* ACCEPT */}
              <TableCell>
                {row.accept ? (
                  <span className="text-green-600 font-semibold">Accepted</span>
                ) : (
                  "-"
                )}
              </TableCell>

              {/* CANCEL */}
              <TableCell>
                {row.cancel ? (
                  <span className="text-red-600 font-semibold">Cancelled</span>
                ) : (
                  "-"
                )}
              </TableCell>

              {/* WORK STATUS */}
              <TableCell>{row.work_status}</TableCell>

              {/* ACTION BUTTONS */}
              <TableCell className="text-right space-x-2">

                <button
                  className="rounded-md bg-primary px-3 py-1 text-xs text-white hover:bg-primary/90"
                >
                  Order Detail
                </button>

                <button
                  className="rounded-md bg-yellow-500 px-3 py-1 text-xs text-white hover:bg-yellow-600"
                >
                  Reassign New Order
                </button>

              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

    </div>
  );
};

export default AcceptOrderPage;
