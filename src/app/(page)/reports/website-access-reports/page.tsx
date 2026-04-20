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

type LoginHistory = {
  id: number | string;
  username?: string;
  ipaddress?: string;
  lastlogintime?: string;
  useraddress?: string;
  country?: string;
};

const ITEMS_PER_PAGE = 20;

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB");
};

const exportRows = (rows: LoginHistory[]) => {
  if (!rows.length) {
    window.alert("No website access records available to export.");
    return;
  }

  const headers = [
    "Id",
    "User Name",
    "IP Address",
    "Last Login Date",
    "Address",
  ];

  const csvRows = rows.map((row) => [
    row.id,
    row.username || "",
    row.ipaddress || "",
    formatDate(row.lastlogintime),
    row.useraddress || "",
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "WebsiteAccessReport.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};

const LoginHistoryTable = () => {
  const [rows, setRows] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadRows = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/website-access");
      const nextRows = Array.isArray(response.data) ? response.data : [];
      setRows(nextRows);
      setMessage(null);
    } catch (error) {
      setRows([]);
      setMessage(getApiErrorMessage(error, "Unable to load website access data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, rows]);

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Website Access Report
        </h2>

        <button
          onClick={() => exportRows(rows)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Get Data
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
          {message}
        </div>
      )}

      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] text-sm text-dark dark:bg-dark-2 dark:text-white [&>th]:py-3">
            <TableHead>Id</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Last Login Date</TableHead>
            <TableHead>Address</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-dark-5">
                Loading website access data...
              </TableCell>
            </TableRow>
          ) : paginatedRows.length ? (
            paginatedRows.map((row) => (
              <TableRow key={row.id} className="border-[#eee] dark:border-dark-3">
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.username || "—"}</TableCell>
                <TableCell>{row.ipaddress || "—"}</TableCell>
                <TableCell>{formatDate(row.lastlogintime)}</TableCell>
                <TableCell className="max-w-[420px] whitespace-normal">
                  {row.useraddress || row.country || "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-dark-5">
                No data found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={rows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        label="website access records"
      />
    </div>
  );
};

export default LoginHistoryTable;
