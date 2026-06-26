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
import { PencilSquareIcon, TrashIcon } from "@/assets/icons";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type TransactionRow = {
  id: number | string;
  status: string;
  amount: number | string;
  credits: number | string;
  transaction_id?: string;
  created_date?: string;
  createdby?: string;
  client_name?: string;
  firstname?: string;
  lastname?: string;
};

type Filters = {
  username: string;
  type: "credit" | "bonus" | "all";
};

const ITEMS_PER_PAGE = 20;

const formatAmount = (value: number | string | undefined) =>
  `$${Number(value ?? 0).toFixed(2)}`;

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB");
};

const exportRows = (rows: TransactionRow[]) => {
  if (!rows.length) {
    window.alert("No transaction data available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "Status",
    "Amount ($)",
    "Credits",
    "Transaction ID",
    "Refill Date",
    "User Name",
    "Client Name",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.status || "",
    formatAmount(row.amount),
    row.credits ?? 0,
    row.id,
    formatDate(row.created_date),
    row.createdby || "",
    row.client_name || `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(),
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "AllTransaction.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};

const CreditTransactionPage = () => {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [draftUsername, setDraftUsername] = useState("");
  const [filters, setFilters] = useState<Filters>({ username: "", type: "all" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionId, setActionId] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadTransactions = useCallback(async (nextFilters: Filters) => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/transactions", {
        params: {
          username: nextFilters.username || undefined,
          type: nextFilters.type,
        },
      });

      setRows(Array.isArray(response.data) ? response.data : []);
      setMessage(null);
    } catch (error) {
      setRows([]);
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load transaction data."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions(filters);
  }, [filters, loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, rows]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, username: draftUsername.trim() }));
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as Filters["type"];
    setFilters({ username: draftUsername.trim(), type: nextType });
  };

  const handleApprove = async (row: TransactionRow) => {
    if (["Success", "Approved"].includes(row.status)) {
      return;
    }

    const confirmed = window.confirm(
      `Mark transaction ${row.id} as successful and apply credits?`,
    );

    if (!confirmed) {
      return;
    }

    setActionId(row.id);

    try {
      await axiosInstance.patch(`/masters/transaction/${row.id}/approve`);
      setMessage({
        type: "success",
        text: "Transaction is updated",
      });
      await loadTransactions(filters);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to update transaction."),
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (row: TransactionRow) => {
    const confirmed = window.confirm(`Delete transaction ${row.id}?`);

    if (!confirmed) {
      return;
    }

    setActionId(row.id);

    try {
      await axiosInstance.delete(`/masters/transaction/${row.id}`);
      setMessage({
        type: "success",
        text: "Transaction is deleted",
      });
      await loadTransactions(filters);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to delete transaction."),
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Transaction Details
        </h2>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-12 md:items-center">
        <div className="md:col-span-4">
          <div className="flex">
            <input
              type="text"
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
              placeholder="Enter Clients User Name"
              className="w-full rounded-l-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
            <button
              onClick={handleSearch}
              className="rounded-r-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <select
            value={filters.type}
            onChange={handleTypeChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          >
            <option value="credit">Credit</option>
            <option value="bonus">Bonus</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="md:col-span-4 md:col-start-7">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark dark:text-white">
              Total Transactions Count :
            </span>
            <input
              value={rows.length}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-1 px-4 py-3 text-dark-5 dark:border-dark-3 dark:bg-dark-2"
            />
          </div>
        </div>

        <div className="md:col-span-2 md:text-right">
          <button
            onClick={() => exportRows(rows)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Get Data
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark dark:bg-green-dark/20 dark:text-green-light-4"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4"
            }`}
        >
          {message.text}
        </div>
      )}

      <Table className="min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] text-sm text-dark dark:bg-dark-2 dark:text-white [&>th]:py-3">
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
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-dark-5">
                Loading transaction data...
              </TableCell>
            </TableRow>
          ) : paginatedRows.length ? (
            paginatedRows.map((row, index) => {
              const isBusy = actionId === row.id;
              const clientName =
                row.client_name ||
                `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim() ||
                "—";

              return (
                <TableRow key={row.id} className="border-[#eee] dark:border-dark-3">
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Update transaction"
                        disabled={isBusy || ["Success", "Approved"].includes(row.status)}
                        onClick={() => handleApprove(row)}
                      >
                        <PencilSquareIcon />
                      </button>

                      <button
                        className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete transaction"
                        disabled={isBusy}
                        onClick={() => handleDelete(row)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{row.status || "-"}</TableCell>
                  <TableCell>{formatAmount(row.amount)}</TableCell>
                  <TableCell>{row.credits ?? 0}</TableCell>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{formatDate(row.created_date)}</TableCell>
                  <TableCell>{row.createdby || "-"}</TableCell>
                  <TableCell>{clientName || "-"}</TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-dark-5">
                No Data Found !
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
        label="transactions"
      />
    </div>
  );
};

export default CreditTransactionPage;
