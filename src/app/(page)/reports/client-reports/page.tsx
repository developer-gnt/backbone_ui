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

type ClientRow = {
  id: string;
  orders: number;
  email: string;
  username: string;
  wallet_balance: number;
  status: string;
  company_name: string;
  first_name: string;
  last_name: string;
  mobile: string;
  reference_source: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  registration_date: string;
};

const dummyClients: ClientRow[] = [
  {
    id: "1",
    orders: 12,
    email: "client1@example.com",
    username: "clientuser1",
    wallet_balance: 250.5,
    status: "Active",
    company_name: "Backbone Data Solutions",
    first_name: "Amaan",
    last_name: "Shaikh",
    mobile: "9876543210",
    reference_source: "Google Ads",
    address: "MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    zipcode: "400001",
    registration_date: "2025-01-14",
  },
  {
    id: "2",
    orders: 5,
    email: "client2@example.com",
    username: "clientuser2",
    wallet_balance: 89.2,
    status: "Inactive",
    company_name: "Tech World",
    first_name: "John",
    last_name: "Doe",
    mobile: "9988776655",
    reference_source: "Referral",
    address: "Park Street",
    city: "Kolkata",
    state: "West Bengal",
    zipcode: "700001",
    registration_date: "2025-02-01",
  },
];

const ClientOverviewTable = () => {
  const [rows] = useState(dummyClients);

  return (
    <div className="rounded-[10px] border border-stroke p-6 bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">

      <h2 className="text-xl font-semibold mb-6 text-dark dark:text-white">
        Client Overview
      </h2>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 text-sm text-dark dark:text-white">
            <TableHead>Sr. No.</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Wallet Balance ($)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Company Name</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Reference Source</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Zip Code</TableHead>
            <TableHead>Registration Date</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((client, index) => (
            <TableRow key={client.id} className="border-[#eee] dark:border-dark-3">

              <TableCell>{index + 1}</TableCell>
              <TableCell>{client.orders}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.username}</TableCell>
              <TableCell>${client.wallet_balance.toFixed(2)}</TableCell>

              <TableCell>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    client.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {client.status}
                </span>
              </TableCell>

              <TableCell>{client.company_name}</TableCell>
              <TableCell>{client.first_name}</TableCell>
              <TableCell>{client.last_name}</TableCell>
              <TableCell>{client.mobile}</TableCell>
              <TableCell>{client.reference_source}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>{client.city}</TableCell>
              <TableCell>{client.state}</TableCell>
              <TableCell>{client.zipcode}</TableCell>
              <TableCell>{client.registration_date}</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length === 0 && (
        <p className="text-center mt-4 text-gray-500 dark:text-gray-300">
          No clients found.
        </p>
      )}
    </div>
  );
};

export default ClientOverviewTable;
