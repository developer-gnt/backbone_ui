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

import { PencilSquareIcon, TrashIcon } from "@/assets/icons"; // ← your existing icons
// OR use inline icons:
// import { PencilSquareIcon, TrashIcon } from "@/assets/icons";

type TransactionRow = {
  id: string;
  status: string;
  amount: number;
  credits: number;
  transaction_id: string;
  refill_date: string;
  user_name: string;
  client_name: string;
};

const dummyData: TransactionRow[] = [
  {
    id: "1",
    status: "Completed",
    amount: 150.0,
    credits: 10,
    transaction_id: "TXN-88492",
    refill_date: "2025-01-04",
    user_name: "Amaan",
    client_name: "David Johnson",
  },
  {
    id: "2",
    status: "Pending",
    amount: 99.99,
    credits: 5,
    transaction_id: "TXN-12345",
    refill_date: "2025-01-10",
    user_name: "Shaikh",
    client_name: "John Doe",
  },
];

const CreditTransactionPage = () => {
  const [rows, setRows] = useState(dummyData);

  const handleEdit = (id: string) => {
    console.log("Edit clicked for:", id);
    alert("Edit action here");
  };

  const handleDelete = (id: string) => {
    setRows((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="rounded-[10px] border border-stroke p-6 bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      
      {/* Header */}
      <h2 className="text-xl font-semibold mb-6 text-dark dark:text-white">
        Transaction Report
      </h2>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 text-sm text-dark dark:text-white">
            <TableHead>Sr. No.</TableHead>
            <TableHead>Change Status</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount ($)</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Refill Date</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Client Name</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id} className="border-[#eee] dark:border-dark-3">

              <TableCell>{index + 1}</TableCell>

              {/* Change Status → Edit + Delete Icons */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <button
                    className="text-primary hover:text-primary/80"
                    title="Edit Status"
                    onClick={() => handleEdit(row.id)}
                  >
                    <PencilSquareIcon />
                  </button>

                  <button
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                    onClick={() => handleDelete(row.id)}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </TableCell>

              <TableCell>{row.status}</TableCell>
              <TableCell>${row.amount.toFixed(2)}</TableCell>
              <TableCell>{row.credits}</TableCell>
              <TableCell>{row.transaction_id}</TableCell>
              <TableCell>{row.refill_date}</TableCell>
              <TableCell>{row.user_name}</TableCell>
              <TableCell>{row.client_name}</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <p className="text-center mt-4 text-gray-500 dark:text-gray-300">
          No records found.
        </p>
      )}
    </div>
  );
};

export default CreditTransactionPage;
