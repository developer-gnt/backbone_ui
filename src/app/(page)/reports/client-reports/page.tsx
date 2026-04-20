"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type ClientRow = {
  id: number | string;
  orders: number;
  email?: string;
  username?: string;
  wallete_balance?: number;
  status?: string;
  companyname?: string;
  firstname?: string;
  lastname?: string;
  mobileno?: string;
  referedby?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  registration_date?: string;
};

type Filters = {
  name: string;
  email: string;
  username: string;
  pageSize: string;
};

const initialFilters: Filters = {
  name: "",
  email: "",
  username: "",
  pageSize: "50",
};

const ITEMS_PER_PAGE = 10;

const formatCurrency = (value?: number) => `${Number(value ?? 0).toFixed(2)}`;

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
};

const exportRows = (rows: ClientRow[]) => {
  if (!rows.length) {
    window.alert("No client data available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "Orders",
    "Email",
    "User Name",
    "Wallet Balance",
    "Status",
    "Company Name",
    "First Name",
    "Last Name",
    "Mobile",
    "Reference Source",
    "Address",
    "City",
    "State",
    "ZipCode",
    "Registration Date",
  ];

  const csvRows = rows.map((client, index) => [
    index + 1,
    client.orders ?? 0,
    client.email || "",
    client.username || "",
    formatCurrency(client.wallete_balance),
    client.status || "",
    client.companyname || "",
    client.firstname || "",
    client.lastname || "",
    client.mobileno || "",
    client.referedby || "",
    client.address || "",
    client.city || "",
    client.state || "",
    client.zipcode || "",
    formatDate(client.registration_date),
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ClientList.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};

const ClientOverviewTable = () => {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadClients = useCallback(async (nextFilters: Filters) => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/clients", {
        params: {
          name: nextFilters.name || undefined,
          email: nextFilters.email || undefined,
          username: nextFilters.username || undefined,
          pageSize: nextFilters.pageSize,
        },
      });

      setRows(Array.isArray(response.data) ? response.data : []);
      setMessage(null);
    } catch (error) {
      setRows([]);
      setMessage(getApiErrorMessage(error, "Unable to load client report data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients(filters);
  }, [filters, loadClients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, rows]);

  const handleSearch = () => {
    setFilters({ ...draftFilters });
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = { ...draftFilters, pageSize: event.target.value };
    setDraftFilters(next);
    setFilters(next);
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Clients Database
        </h2>
      </div>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:justify-end">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 xl:w-auto">
          <input
            type="text"
            value={draftFilters.name}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Client Name"
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />

          <input
            type="text"
            value={draftFilters.email}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="Email Address"
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />

          <input
            type="text"
            value={draftFilters.username}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, username: event.target.value }))
            }
            placeholder="User Name"
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />

          <button
            onClick={handleSearch}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Search
          </button>

          <button
            onClick={() => exportRows(rows)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Get Data
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
          {message}
        </div>
      )}

      <Table className="min-w-[1700px]">
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] text-sm text-dark dark:bg-dark-2 dark:text-white [&>th]:py-3">
            <TableHead>Sr. No.</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Wallet Balance</TableHead>
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
          {loading ? (
            <TableRow>
              <TableCell colSpan={16} className="py-8 text-center text-dark-5">
                Loading client report data...
              </TableCell>
            </TableRow>
          ) : paginatedRows.length ? (
            paginatedRows.map((client, index) => (
              <TableRow key={client.id} className="border-[#eee] dark:border-dark-3">
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell>{client.orders ?? 0}</TableCell>
                <TableCell>{client.email || "—"}</TableCell>
                <TableCell>{client.username || "—"}</TableCell>
                <TableCell>{formatCurrency(client.wallete_balance)}</TableCell>
                <TableCell>{client.status || "-"}</TableCell>
                <TableCell>{client.companyname || "-"}</TableCell>
                <TableCell>{client.firstname || "-"}</TableCell>
                <TableCell>{client.lastname || "-"}</TableCell>
                <TableCell>{client.mobileno || "-"}</TableCell>
                <TableCell>{client.referedby || "-"}</TableCell>
                <TableCell>{client.address || "-"}</TableCell>
                <TableCell>{client.city || "-"}</TableCell>
                <TableCell>{client.state || "-"}</TableCell>
                <TableCell>{client.zipcode || "-"}</TableCell>
                <TableCell>{formatDate(client.registration_date)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={16} className="py-8 text-center text-dark-5">
                Clients Registrations Not Found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          label="clients"
        />

        <div className="flex justify-end">
          <select
            value={draftFilters.pageSize}
            onChange={handlePageSizeChange}
            className="rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClientOverviewTable;
