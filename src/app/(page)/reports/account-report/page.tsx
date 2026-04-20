"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import TablePagination from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

const ITEMS_PER_PAGE = 10;

type TransactionRow = {
  id: number | string;
  amount?: number | string;
  credits?: number | string;
  transaction_id?: string;
  created_date?: string;
  transaction_type?: string;
  order_id?: number | string;
  subject_address?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB");
};

const exportRows = (rows: TransactionRow[], type: "credit" | "debit") => {
  if (!rows.length) {
    window.alert(`No ${type} records are available to export.`);
    return;
  }

  const headers =
    type === "credit"
      ? ["Sr. No.", "Amount", "Credits", "Transaction ID", "Credit Date"]
      : ["Sr. No.", "Debits", "File #", "Property Address", "Debit Date"];

  const csvRows = rows.map((row, index) =>
    type === "credit"
      ? [
          index + 1,
          row.amount ?? "",
          row.credits ?? "",
          row.transaction_id ?? "",
          formatDate(row.created_date),
        ]
      : [index + 1, row.amount ?? "", row.order_id ?? "", row.subject_address ?? "", formatDate(row.created_date)],
  );

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-history.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function AccountReportPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"credit" | "debit">("credit");
  const [creditRows, setCreditRows] = useState<TransactionRow[]>([]);
  const [debitRows, setDebitRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const username = user?.username || user?.email || undefined;
        const [credits, debits] = await Promise.all([
          axiosInstance.get("/masters/reports/transactions", {
            params: { username, type: "credit" },
          }),
          axiosInstance.get("/masters/reports/transactions", {
            params: { username, type: "debit" },
          }),
        ]);

        setCreditRows(Array.isArray(credits.data) ? credits.data : []);
        setDebitRows(Array.isArray(debits.data) ? debits.data : []);
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, "Unable to load account history."));
        setCreditRows([]);
        setDebitRows([]);
      } finally {
        setLoading(false);
      }
    };

    void loadTransactions();
  }, [user?.email, user?.username]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const currentRows = activeTab === "credit" ? creditRows : debitRows;
  const totalPages = Math.max(1, Math.ceil(currentRows.length / ITEMS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return currentRows.slice(start, start + ITEMS_PER_PAGE);
  }, [currentRows, page]);

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Credit / Debit History</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-stroke p-1 dark:border-dark-3">
          <button
            onClick={() => setActiveTab("credit")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "credit"
                ? "bg-primary text-white"
                : "text-dark-5 hover:bg-gray-2 dark:hover:bg-dark-2"
            }`}
          >
            Credit Details
          </button>
          <button
            onClick={() => setActiveTab("debit")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "debit"
                ? "bg-primary text-white"
                : "text-dark-5 hover:bg-gray-2 dark:hover:bg-dark-2"
            }`}
          >
            Debit Details
          </button>
        </div>

        <button
          onClick={() => exportRows(currentRows, activeTab)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Get Data
        </button>
      </div>

      {activeTab === "credit" && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-dark dark:text-white">
          <span className="font-medium">Additional Points:</span>
          <input
            readOnly
            value={`${user?.points ?? 0}`}
            title="For each 100 additional point, 10 bonus credit will be added automatically!!"
            className="w-[200px] rounded-md border border-stroke bg-gray-1 px-3 py-2 text-sm text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead>Sr. No.</TableHead>
              <TableHead>{activeTab === "credit" ? "Amount" : "Debits"}</TableHead>
              {activeTab === "credit" ? (
                <>
                  <TableHead>Credits</TableHead>
                    <TableHead>Credit Date</TableHead>
                </>
              ) : (
                <>
                  <TableHead>File #</TableHead>
                  <TableHead>Property Address</TableHead>
                </>
              )}
                {activeTab === "debit" && <TableHead>Debit Date</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={`${activeTab}-${row.id}-${index}`} className="border-[#eee] dark:border-dark-3">
                <TableCell>{(page - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                <TableCell>{row.amount ?? 0}</TableCell>
                {activeTab === "credit" ? (
                  <>
                    <TableCell>{row.credits ?? 0}</TableCell>
                    <TableCell>{formatDate(row.created_date)}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{row.order_id ?? "—"}</TableCell>
                    <TableCell>{row.subject_address || "—"}</TableCell>
                    <TableCell>{formatDate(row.created_date)}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!loading && currentRows.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-stroke px-4 py-8 text-center text-sm text-dark-5 dark:border-dark-3">
          No {activeTab} history found.
        </div>
      )}

      {loading && (
        <div className="mt-4 rounded-lg border border-dashed border-stroke px-4 py-8 text-center text-sm text-dark-5 dark:border-dark-3">
          Loading account history...
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={currentRows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
        label={activeTab === "credit" ? "credit rows" : "debit rows"}
      />
    </div>
  );
}
