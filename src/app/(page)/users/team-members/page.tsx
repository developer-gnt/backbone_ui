"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import TablePagination from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TeamMemberRow = {
  id: number | string;
  role?: string;
  status?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  mobileno?: string;
  address?: string;
  registration_date?: string;
  emp_supervisor?: string;
};

const ITEMS_PER_PAGE = 10;

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const exportRows = (rows: TeamMemberRow[]) => {
  if (!rows.length) {
    window.alert("No team members available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "Role",
    "Status",
    "EMP ID",
    "First Name",
    "Last Name",
    "Email",
    "Mobile",
    "Address",
    "Registration Date",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.role || "",
    row.status || "",
    row.id,
    row.firstname || "",
    row.lastname || "",
    row.email || "",
    row.mobileno || "",
    row.address || "",
    formatDate(row.registration_date),
  ]);

  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "TeamMembers.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function TeamMembersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadTeamMembers = async () => {
      setLoading(true);

      try {
        const response = await axiosInstance.get("/user/employees", {
          params: { role: "Team Member" },
        });

        const identifiers = [user?.username, user?.email, `${user?.id ?? ""}`]
          .map((value) => `${value ?? ""}`.trim().toLowerCase())
          .filter(Boolean);

        const nextRows = (Array.isArray(response.data) ? response.data : []).filter(
          (row: TeamMemberRow) => identifiers.includes(`${row.emp_supervisor ?? ""}`.trim().toLowerCase()),
        );

        setRows(nextRows);
        setMessage(null);
      } catch (error) {
        setRows([]);
        setMessage(getApiErrorMessage(error, "Unable to load team members."));
      } finally {
        setLoading(false);
      }
    };

    void loadTeamMembers();
  }, [user?.email, user?.id, user?.username]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.id,
        row.role,
        row.status,
        row.firstname,
        row.lastname,
        row.email,
        row.mobileno,
        row.address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [rows, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Overview</p>
          <h2 className="text-xl font-semibold text-dark dark:text-white">Team Member</h2>
          <p className="mt-1 text-sm text-dark-5">Your team members linked to this supervisor account.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportRows(filteredRows)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Get Data
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search team members"
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No.</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>EMP ID</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Registration Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-dark-5">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length ? (
              paginatedRows.map((row, index) => (
                <TableRow key={String(row.id)}>
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell>{row.role || "Team Member"}</TableCell>
                  <TableCell>{row.status || "-"}</TableCell>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.firstname || "-"}</TableCell>
                  <TableCell>{row.lastname || "-"}</TableCell>
                  <TableCell>{row.email || "-"}</TableCell>
                  <TableCell>{row.mobileno || "-"}</TableCell>
                  <TableCell>{row.address || "-"}</TableCell>
                  <TableCell>{formatDate(row.registration_date)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-dark-5">
                  No Result Found!!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filteredRows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        label="team members"
      />
    </div>
  );
}
