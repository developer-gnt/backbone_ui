"use client";

import { useAuth } from "@/components/Auth/AuthProvider";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";

type PointTransaction = {
  id: number;
  points_change: number;
  type: string;
  description: string | null;
  order_id: number | null;
  created_date: string;
};

export default function PointsHistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get("/masters/points/client/history");
        setTransactions(response.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load points history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalPointsRedeemed = transactions
    .filter((tx) => tx.points_change < 0)
    .reduce((sum, tx) => sum + Math.abs(Number(tx.points_change)), 0);

  const calculatedEarned = transactions
    .filter((tx) => tx.points_change > 0)
    .reduce((sum, tx) => sum + Number(tx.points_change), 0);

  const totalPointsEarned = Math.max(
    calculatedEarned,
    (user?.feedback_points || 0) + totalPointsRedeemed
  );



  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const visibleTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (isLoading) {
    return <div className="p-10 text-center">Loading points history...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Feedback Points History
          </h2>
          <p className="mt-1 text-sm text-dark-5">
            Track your earned and redeemed feedback points over time.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
            Current Available Points
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {user?.feedback_points || 0}
          </p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
            Total Points Earned
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {totalPointsEarned}
          </p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
            Total Points Redeemed
          </p>
          <p className="mt-1 text-2xl font-bold text-orange-500">
            {totalPointsRedeemed}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-stroke dark:border-dark-3">
                <TableHead className="min-w-[150px] font-medium text-dark dark:text-dark-6">
                  Date
                </TableHead>
                <TableHead className="font-medium text-dark dark:text-dark-6">
                  Type
                </TableHead>
                <TableHead className="font-medium text-dark dark:text-dark-6">
                  Description
                </TableHead>
                <TableHead className="font-medium text-dark dark:text-dark-6">
                  Order #
                </TableHead>
                <TableHead className="text-right font-medium text-dark dark:text-dark-6">
                  Points
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTransactions.length > 0 ? (
                visibleTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="border-stroke dark:border-dark-3"
                  >
                    <TableCell className="text-dark dark:text-white">
                      {dayjs(tx.created_date).format("MMM DD, YYYY HH:mm")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tx.type === "EARNED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-dark dark:text-white">
                      {tx.description || "-"}
                    </TableCell>
                    <TableCell className="text-dark dark:text-white">
                      {tx.order_id ? `#${tx.order_id}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          tx.points_change > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-500 dark:text-orange-400"
                        }`}
                      >
                        {tx.points_change > 0 ? "+" : ""}
                        {tx.points_change}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-dark-5 dark:text-dark-6"
                  >
                    No point transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-stroke px-6 py-4 dark:border-dark-3">
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={transactions.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
