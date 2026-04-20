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

type EmployeeReport = {
  id: number | string;
  firstname: string;
  lastname: string;
  registration_date?: string;
  role: "Supervisor" | "Team Member" | string;
  status: string;
  supervisor_name?: string;
  orders_assigned: number;
  orders_completed: number;
  orders_cancelled: number;
};

type ReportTab = "Supervisor" | "Team Member";

const tabConfig: Array<{ label: string; value: ReportTab }> = [
  { label: "Supervisors", value: "Supervisor" },
  { label: "Team Members", value: "Team Member" },
];

const ITEMS_PER_PAGE = 10;

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
};

const exportRows = (rows: EmployeeReport[], activeTab: ReportTab) => {
  if (!rows.length) {
    window.alert("No data available to export.");
    return;
  }

  const headers =
    activeTab === "Supervisor"
      ? [
          "Sr. No.",
          "EMP ID",
          "First Name",
          "Last Name",
          "Registration Date",
          "Order Assigned",
          "Completed Orders",
          "Cancel Orders",
        ]
      : [
          "Sr. No.",
          "EMP ID",
          "First Name",
          "Last Name",
          "Registration Date",
          "Supervisor",
          "Order Assigned",
          "Completed Orders",
          "Cancel Orders",
        ];

  const csvRows = rows.map((row, index) =>
    activeTab === "Supervisor"
      ? [
          index + 1,
          row.id,
          row.firstname || "",
          row.lastname || "",
          formatDate(row.registration_date),
          row.orders_assigned,
          row.orders_completed,
          row.orders_cancelled,
        ]
      : [
          index + 1,
          row.id,
          row.firstname || "",
          row.lastname || "",
          formatDate(row.registration_date),
          row.supervisor_name || "—",
          row.orders_assigned,
          row.orders_completed,
          row.orders_cancelled,
        ],
  );

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activeTab === "Supervisor" ? "SupervisorList" : "TeamMemberList"}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const EmployeeReportPage = () => {
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("Supervisor");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/employees");
      setReports(Array.isArray(response.data) ? response.data : []);
      setMessage(null);
    } catch (error) {
      setReports([]);
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load employee reports."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports
      .filter((row) => row.role === activeTab)
      .filter((row) => {
        if (!query) return true;

        return [
          row.id,
          row.firstname,
          row.lastname,
          row.supervisor_name,
          row.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [activeTab, reports, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredRows]);

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Overview</p>
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            Employee Reports
          </h2>
          <p className="mt-1 text-sm text-dark-5">
            All employee reports and assigned project counts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportRows(filteredRows, activeTab)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Get Data
          </button>
          <button
            onClick={loadReports}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-stroke pb-3 dark:border-dark-3">
        {tabConfig.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.value
                ? "bg-primary text-white"
                : "bg-gray-1 text-dark hover:bg-gray-2 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={`Search ${activeTab === "Supervisor" ? "supervisors" : "team members"}...`}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4"
              : "border-green-200 bg-green-50 text-green-700 dark:border-green-dark dark:bg-green-dark/20 dark:text-green-light-4"
          }`}
        >
          {message.text}
        </div>
      )}

      <Table className="min-w-[1050px]">
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] text-sm text-dark dark:bg-dark-2 dark:text-white [&>th]:py-3">
            <TableHead>Sr. No.</TableHead>
            <TableHead>EMP ID</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Registration Date</TableHead>
            {activeTab === "Team Member" && <TableHead>Supervisor</TableHead>}
            <TableHead>Order Assigned</TableHead>
            <TableHead>Completed Orders</TableHead>
            <TableHead>Cancel Orders</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={activeTab === "Team Member" ? 9 : 8}
                className="py-8 text-center text-dark-5"
              >
                Loading report data...
              </TableCell>
            </TableRow>
          ) : paginatedRows.length ? (
            paginatedRows.map((emp, index) => (
              <TableRow key={`${activeTab}-${emp.id}`} className="border-[#eee] dark:border-dark-3">
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell>{emp.id}</TableCell>
                <TableCell>{emp.firstname || "—"}</TableCell>
                <TableCell>{emp.lastname || "—"}</TableCell>
                <TableCell>{formatDate(emp.registration_date)}</TableCell>
                {activeTab === "Team Member" && (
                  <TableCell>{emp.supervisor_name || "—"}</TableCell>
                )}
                <TableCell>{emp.orders_assigned ?? 0}</TableCell>
                <TableCell>{emp.orders_completed ?? 0}</TableCell>
                <TableCell>{emp.orders_cancelled ?? 0}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={activeTab === "Team Member" ? 9 : 8}
                className="py-8 text-center text-dark-5"
              >
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filteredRows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        label={activeTab === "Supervisor" ? "supervisors" : "team members"}
      />
    </div>
  );
};

export default EmployeeReportPage;
