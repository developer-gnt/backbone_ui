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

type AttendanceRow = {
  username: string;
  todaysdate: string;
  logintime?: string;
  logouttime?: string;
  WorkingHour?: string;
};

type AttendanceFilters = {
  username: string;
  fromDate: string;
  toDate: string;
};

const ITEMS_PER_PAGE = 10;
const today = new Date().toISOString().split("T")[0];

const initialFilters: AttendanceFilters = {
  username: "",
  fromDate: today,
  toDate: today,
};

const formatDate = (value?: string, includeTime = false) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return includeTime
    ? date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString("en-GB");
};

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<AttendanceFilters>(initialFilters);
  const [filters, setFilters] = useState<AttendanceFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadAttendance = useCallback(async (nextFilters: AttendanceFilters) => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/attendance", {
        params: {
          username: nextFilters.username || undefined,
          fromDate: nextFilters.fromDate || undefined,
          toDate: nextFilters.toDate || undefined,
        },
      });

      setRows(Array.isArray(response.data) ? response.data : []);
      setMessage(null);
    } catch (error) {
      setRows([]);
      setMessage(getApiErrorMessage(error, "Unable to load attendance data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance(filters);
  }, [filters, loadAttendance]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, rows]);

  const handleShowAttendance = () => {
    if (
      draftFilters.fromDate &&
      draftFilters.toDate &&
      draftFilters.fromDate > draftFilters.toDate
    ) {
      setMessage("From Date cannot be later than To Date.");
      return;
    }

    setFilters({ ...draftFilters });
  };

  const handleReset = () => {
    const cleared = { username: "", fromDate: "", toDate: "" };
    setDraftFilters(cleared);
    setFilters(cleared);
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Overview</p>
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Attendance
        </h2>
        <p className="mt-1 text-sm text-dark-5">
          View employee attendance here.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <input
          type="text"
          value={draftFilters.username}
          onChange={(event) =>
            setDraftFilters((prev) => ({ ...prev, username: event.target.value }))
          }
          placeholder="Email Id / Username"
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />

        <input
          type="date"
          value={draftFilters.fromDate}
          onChange={(event) =>
            setDraftFilters((prev) => ({ ...prev, fromDate: event.target.value }))
          }
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />

        <input
          type="date"
          value={draftFilters.toDate}
          onChange={(event) =>
            setDraftFilters((prev) => ({ ...prev, toDate: event.target.value }))
          }
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />

        <div className="flex gap-2">
          <button
            onClick={handleShowAttendance}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Show Attendance
          </button>
          <button
            onClick={handleReset}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
          >
            Reset
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
          {message}
        </div>
      )}

      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm">
            <TableHead>Sr. No.</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Login Time</TableHead>
            <TableHead>Log Out</TableHead>
            <TableHead>Working Hour</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-dark-5">
                Loading attendance data...
              </TableCell>
            </TableRow>
          ) : paginatedRows.length ? (
            paginatedRows.map((row, index) => (
              <TableRow key={`${row.username}-${row.todaysdate}-${index}`} className="border-[#eee] dark:border-dark-3">
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell>{row.username || "—"}</TableCell>
                <TableCell>{formatDate(row.todaysdate)}</TableCell>
                <TableCell>{formatDate(row.logintime, true)}</TableCell>
                <TableCell>{formatDate(row.logouttime, true)}</TableCell>
                <TableCell>{row.WorkingHour || "N/A"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-dark-5">
                No attendance data found.
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
        label="attendance records"
      />
    </div>
  );
}
