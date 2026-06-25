"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
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
import { getAttachmentUrl as getAttachmentLink } from "@/lib/attachmentUrl";

type OrderReportRow = {
  id: number | string;
  package?: string;
  tat?: string;
  created_date?: string;
  status?: string;
  createdby?: string;
  client_name?: string;
  email?: string;
  subject_address?: string;
  emp_remark?: string;
  remaining_tat?: string;
  feedback_rating?: number | string;
  modify_date?: string;
  feedback?: string;
  assigner_name?: string;
  assigned_supervisor?: string;
  remark?: string;
  reply?: string;
};

type AttachmentRow = {
  id: number | string;
  type?: string;
  filename?: string;
  filepath?: string;
};

type OrderDetailResponse = {
  order: {
    id: number | string;
    package?: string;
    tat?: string;
    created_date?: string;
    status?: string;
    createdby?: string;
    client_name?: string;
    email?: string;
    supervisor_name?: string;
    team_member_name?: string;
    order_type?: string;
    reoform?: string;
    non_uad?: string;
    financing?: string;
    borrower_name?: string;
    subject_address?: string;
    subject_state?: string;
    subject_city?: string;
    subject_zipcode?: string;
    standard_instruction?: string;
    description?: string;
    sketch?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

type Filters = {
  fileNo: string;
  subjectAddress: string;
  clientName: string;
  pageSize: string;
};

const initialFilters: Filters = {
  fileNo: "",
  subjectAddress: "",
  clientName: "",
  pageSize: "300",
};

const ITEMS_PER_PAGE = 10;

const statusClasses: Record<string, string> = {
  Completed:
    "bg-green-light-6 text-green-700 dark:bg-green-dark/30 dark:text-green-light-4",
  Success:
    "bg-green-light-6 text-green-700 dark:bg-green-dark/30 dark:text-green-light-4",
  Pending:
    "bg-yellow-light-4 text-yellow-800 dark:bg-yellow-dark/30 dark:text-yellow-light-4",
  Cancel:
    "bg-red-light-6 text-red-700 dark:bg-red-dark/30 dark:text-red-light-4",
  "Work In Progress":
    "bg-blue-light-5 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-light-4",
};

const tatClasses: Record<string, string> = {
  "04": "bg-red-light-6 text-red-700 dark:bg-red-dark/30 dark:text-red-light-4",
  "06": "bg-blue-light-5 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-light-4",
  "12": "bg-green-light-6 text-green-700 dark:bg-green-dark/30 dark:text-green-light-4",
};

const formatDate = (value?: string, includeTime = false) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return includeTime
    ? date.toLocaleString("en-GB")
    : date.toLocaleDateString("en-GB");
};

const exportRows = (rows: OrderReportRow[], isTeamMember: boolean, isSupervisor: boolean) => {
  if (!rows.length) {
    window.alert("No order data available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "File#",
    "TAT",
    "Order Date",
    "Status",
    ...(isTeamMember ? [] : ["User Name", "Client Name", isSupervisor ? "Supervisor ID" : "Email"]),
    "Property Address",
    ...(isTeamMember ? ["Assigned Team Member Name"] : []),
    "Backbone Data Solutions Remark",
    "Remaining TAT",
    "Client Rating",
    "Completed Date",
    "Client Feedback",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.id,
    row.tat || "",
    formatDate(row.created_date, true),
    row.status || "",
    ...(isTeamMember ? [] : [row.createdby || "", row.client_name || "", isSupervisor ? row.assigned_supervisor || "" : row.email || ""]),
    row.subject_address || "",
    ...(isTeamMember ? [row.assigner_name || ""] : []),
    row.emp_remark || row.remark || row.reply || "",
    row.remaining_tat || "",
    row.feedback_rating ?? "",
    formatDate(row.modify_date, true),
    row.feedback || "",
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "AllOrders.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};

const exportClientRows = (rows: OrderReportRow[]) => {
  if (!rows.length) {
    window.alert("No order data available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "File#",
    "TAT",
    "Order Date",
    "Status",
    "Property Address",
    "Rating",
    "Completed Date",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.id,
    row.tat || row.package || "",
    formatDate(row.created_date, true),
    row.status || "",
    row.subject_address || "",
    row.feedback_rating ?? "",
    formatDate(row.modify_date, true),
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Orders_History.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function OrderReport() {
  const { user } = useAuth();
  const normalizedRole = (user?.role ?? "").toLowerCase();
  const isSupervisorView = normalizedRole === "supervisor";
  const isTeamMemberView = normalizedRole === "team member";
  const isClientView = normalizedRole === "client";
  const isMemberView = isSupervisorView || isTeamMemberView;
  const memberKeys = [user?.username, user?.email, `${user?.id ?? ""}`]
    .map((value) => `${value ?? ""}`.trim())
    .filter(Boolean)
    .join(",");
  const [rows, setRows] = useState<OrderReportRow[]>([]);
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<OrderDetailResponse | null>(null);
  const [remarkText, setRemarkText] = useState<string | null>(null);
  const [clientDraftFilters, setClientDraftFilters] = useState({
    from: "",
    to: "",
    subjectAddress: "",
    fileNo: "",
    pageSize: "10",
  });
  const [clientFilters, setClientFilters] = useState({
    from: "",
    to: "",
    subjectAddress: "",
    fileNo: "",
    pageSize: "10",
  });
  const [clientPage, setClientPage] = useState(1);

  const loadOrders = useCallback(async (nextFilters: Filters) => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/orders", {
        params: {
          id: nextFilters.fileNo || undefined,
          subaddress: nextFilters.subjectAddress || undefined,
          name: nextFilters.clientName || undefined,
          createdby: normalizedRole === "client" ? memberKeys : undefined,
          assignedSupervisor: normalizedRole === "supervisor" ? memberKeys : undefined,
          assignedTeamMember: normalizedRole === "team member" ? memberKeys : undefined,
          pageSize: nextFilters.pageSize,
        },
      });

      const payload = response.data;
      const nextRows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setRows(nextRows);
      setTotalCount(
        typeof payload?.totalCount === "number" ? payload.totalCount : nextRows.length,
      );
      setMessage(null);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load order report data."),
      });
    } finally {
      setLoading(false);
    }
  }, [memberKeys, normalizedRole]);

  useEffect(() => {
    loadOrders(filters);
  }, [filters, loadOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const openDetails = async (id: number | string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);

    try {
      const response = await axiosInstance.get(`/masters/reports/orders/${id}/details`);
      setDetails(response.data);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load order details."),
      });
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const applyClientFilters = () => {
    setClientFilters({ ...clientDraftFilters });
    setClientPage(1);
  };

  const filteredClientRows = useMemo(() => {
    if (!isClientView) {
      return [] as OrderReportRow[];
    }

    const fromTime = clientFilters.from ? new Date(clientFilters.from).getTime() : null;
    const toTime = clientFilters.to
      ? new Date(`${clientFilters.to}T23:59:59`).getTime()
      : null;

    return rows.filter((row) => {
      if (clientFilters.fileNo.trim() && !`${row.id}`.includes(clientFilters.fileNo.trim())) {
        return false;
      }

      if (
        clientFilters.subjectAddress.trim() &&
        !`${row.subject_address ?? ""}`
          .toLowerCase()
          .includes(clientFilters.subjectAddress.trim().toLowerCase())
      ) {
        return false;
      }

      if (fromTime !== null || toTime !== null) {
        const createdAt = row.created_date ? new Date(row.created_date).getTime() : NaN;
        if (Number.isNaN(createdAt)) {
          return false;
        }
        if (fromTime !== null && createdAt < fromTime) {
          return false;
        }
        if (toTime !== null && createdAt > toTime) {
          return false;
        }
      }

      return true;
    });
  }, [clientFilters.fileNo, clientFilters.from, clientFilters.subjectAddress, clientFilters.to, isClientView, rows]);

  const clientItemsPerPage = Math.max(1, Number(clientFilters.pageSize) || 10);
  const clientTotalPages = Math.max(1, Math.ceil(filteredClientRows.length / clientItemsPerPage));
  const safeClientPage = Math.min(clientPage, clientTotalPages);
  const pagedClientRows = filteredClientRows.slice(
    (safeClientPage - 1) * clientItemsPerPage,
    safeClientPage * clientItemsPerPage,
  );

  const handleClientPageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    setClientDraftFilters((prev) => ({ ...prev, pageSize: next }));
    setClientFilters((prev) => ({ ...prev, pageSize: next }));
    setClientPage(1);
  };

  if (isClientView) {
    return (
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">All File# History</h2>

          <div className="space-y-3">
            <input
              type="date"
              value={clientDraftFilters.from}
              onChange={(event) =>
                setClientDraftFilters((prev) => ({ ...prev, from: event.target.value }))
              }
              className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />

            <input
              type="date"
              value={clientDraftFilters.to}
              onChange={(event) =>
                setClientDraftFilters((prev) => ({ ...prev, to: event.target.value }))
              }
              className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />

            <input
              type="text"
              placeholder="Subject Address"
              value={clientDraftFilters.subjectAddress}
              onChange={(event) =>
                setClientDraftFilters((prev) => ({ ...prev, subjectAddress: event.target.value }))
              }
              className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />

            <input
              type="text"
              placeholder="File #"
              value={clientDraftFilters.fileNo}
              onChange={(event) =>
                setClientDraftFilters((prev) => ({ ...prev, fileNo: event.target.value }))
              }
              className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />

            <button
              onClick={applyClientFilters}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Get Report
            </button>
          </div>
        </div>

        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark lg:col-span-9">
          <div className="flex items-center justify-between gap-3 border-b border-stroke px-5 py-4 dark:border-dark-3">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Report Details</h3>
            <button
              onClick={() => exportClientRows(filteredClientRows)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Get Data
            </button>
          </div>

          {message && (
            <div
              className={`mx-5 mt-4 rounded-lg border px-4 py-3 text-sm ${message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark dark:bg-green-dark/20 dark:text-green-light-4"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4"
                }`}
            >
              {message.text}
            </div>
          )}

          <div className="overflow-x-auto px-1 pb-1">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="bg-[#F7F9FC] text-sm dark:bg-dark-2 [&>th]:py-3 [&>th]:font-medium">
                  <TableHead>Sr. No.</TableHead>
                  <TableHead>File#</TableHead>
                  <TableHead>TAT</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Property Address</TableHead>
                  <TableHead>Backbone Data Solutions Comments</TableHead>
                  <TableHead>Change In Order</TableHead>
                  <TableHead>Completed Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-dark-5">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : pagedClientRows.length ? (
                  pagedClientRows.map((order, index) => {
                    const normalizedStatus = `${order.status ?? ""}`.trim().toLowerCase();
                    const canEdit = normalizedStatus !== "completed" && normalizedStatus !== "cancel";
                    const comments =
                      order.emp_remark?.trim() ||
                      order.remark?.trim() ||
                      order.reply?.trim() ||
                      "No Comments Found!!";

                    return (
                      <TableRow key={order.id} className="border-[#eee] text-sm dark:border-dark-3">
                        <TableCell>{(safeClientPage - 1) * clientItemsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <a href={`/orders/details/${order.id}`} className="font-medium text-primary underline underline-offset-2">
                            {order.id}
                          </a>
                        </TableCell>
                        <TableCell>{order.package || order.tat || "—"}</TableCell>
                        <TableCell>{formatDate(order.created_date, true)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status || ""] || "bg-gray-2 text-dark"}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[260px] whitespace-normal">
                          {order.subject_address || "—"}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setRemarkText(comments)}
                            className="font-medium text-primary underline"
                          >
                            View Comments
                          </button>
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <a
                              href={`/client/edit-order?oid=${order.id}`}
                              className="inline-flex rounded-md border border-stroke px-2.5 py-1 text-[11px] font-medium hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                            >
                              Edit
                            </a>
                          ) : (
                            <span className="text-dark-5">—</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(order.modify_date, true)}</TableCell>
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke px-5 py-4 dark:border-dark-3">
            <div className="flex items-center gap-2 text-sm text-dark-5">
              <span>Rows per page</span>
              <select
                value={clientDraftFilters.pageSize}
                onChange={handleClientPageSizeChange}
                className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <TablePagination
              page={safeClientPage}
              totalPages={clientTotalPages}
              totalItems={filteredClientRows.length}
              itemsPerPage={clientItemsPerPage}
              onPageChange={setClientPage}
              label="orders"
            />
          </div>
        </div>

        {remarkText !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl rounded-lg border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Comments For Completed Work
                </h3>
                <button
                  onClick={() => setRemarkText(null)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Close
                </button>
              </div>
              <div className="rounded-lg bg-gray-1 px-4 py-4 text-sm text-dark dark:bg-dark-3 dark:text-white">
                {remarkText}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Overview</p>
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          All Orders Reports <span className="text-base font-normal text-dark-5">details till date</span>
        </h2>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <input
          type="text"
          value={draftFilters.fileNo}
          onChange={(event) =>
            setDraftFilters((prev) => ({ ...prev, fileNo: event.target.value }))
          }
          placeholder="File #"
          className="min-w-[180px] flex-1 rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />

        <input
          type="text"
          value={draftFilters.subjectAddress}
          onChange={(event) =>
            setDraftFilters((prev) => ({
              ...prev,
              subjectAddress: event.target.value,
            }))
          }
          placeholder="Subject Address"
          className="min-w-[220px] flex-[1.2] rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />

        {!isMemberView && (
          <input
            type="text"
            value={draftFilters.clientName}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, clientName: event.target.value }))
            }
            placeholder="Client Name"
            className="min-w-[180px] flex-1 rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />
        )}

        <button
          onClick={handleSearch}
          className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          Search
        </button>

        <div className="min-w-[110px]">
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Count
          </label>
          <input
            value={totalCount}
            disabled
            className="w-full rounded-lg border border-stroke bg-gray-1 px-4 py-3 text-dark-5 dark:border-dark-3 dark:bg-dark-2"
          />
        </div>

        <button
          onClick={() => exportRows(rows, isTeamMemberView, isSupervisorView)}
          className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          Get Data
        </button>

        <div className="min-w-[100px]">
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Page Size
          </label>
          <select
            value={draftFilters.pageSize}
            onChange={handlePageSizeChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          >
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="500">500</option>
          </select>
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

      <div className="overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
        <Table className="min-w-[1700px]">
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] text-sm dark:bg-dark-2 [&>th]:py-3 [&>th]:font-medium">
              <TableHead>Sr. No.</TableHead>
              <TableHead>File#</TableHead>
              <TableHead>TAT</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              {!isTeamMemberView && <TableHead>User Name</TableHead>}
              {!isTeamMemberView && <TableHead>Client Name</TableHead>}
              {!isTeamMemberView && <TableHead>{isSupervisorView ? "Supervisor ID" : "Email"}</TableHead>}
              <TableHead>Property Address</TableHead>
              <TableHead>Backbone Data Solutions Remark</TableHead>
              <TableHead>Remaining TAT</TableHead>
              <TableHead>Client Rating</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead>Client Feedback</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isTeamMemberView ? 11 : 14} className="py-8 text-center text-dark-5">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length ? (
              paginatedRows.map((order, index) => {
                const remark = order.emp_remark?.trim() || order.remark?.trim() || order.reply?.trim();
                const remainingTat = order.remaining_tat || "—";
                const isExpired = remainingTat.startsWith("-");

                return (
                  <TableRow key={order.id} className="border-[#eee] text-sm dark:border-dark-3">
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <a href={`/orders/details/${order.id}`} className="font-medium text-primary underline underline-offset-2">
                          {order.id}
                        </a>
                        <button
                          type="button"
                          onClick={() => void openDetails(order.id)}
                          className="w-fit text-xs font-medium text-dark-5 underline hover:text-primary"
                        >
                          Quick View
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tatClasses[order.package || ""] || "bg-gray-2 text-dark"}`}
                      >
                        {order.tat || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(order.created_date, true)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status || ""] || "bg-gray-2 text-dark"}`}
                      >
                        {order.status || "Unknown"}
                      </span>
                    </TableCell>
                    {!isTeamMemberView && <TableCell>{order.createdby || "—"}</TableCell>}
                    {!isTeamMemberView && <TableCell>{order.client_name || "—"}</TableCell>}
                    {!isTeamMemberView && <TableCell>{isSupervisorView ? order.assigned_supervisor || "—" : order.email || "—"}</TableCell>}
                    <TableCell className="max-w-[260px] whitespace-normal">
                      {order.subject_address || "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setRemarkText(remark || "No Remark Found / Incomplete order.")}
                        className="font-medium text-primary underline"
                      >
                        {remark ? "View Remark" : "No Remark"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className={isExpired ? "font-medium text-red-600 dark:text-red-400" : "text-dark dark:text-white"}>
                        {remainingTat}
                      </span>
                    </TableCell>
                    <TableCell>{order.feedback_rating ?? "—"}</TableCell>
                    <TableCell>{formatDate(order.modify_date, true)}</TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">
                      {order.feedback || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={isTeamMemberView ? 11 : 14} className="py-8 text-center text-dark-5">
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          label="orders"
        />
      </div>

      {remarkText !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Backbone Data Solutions Remark
              </h3>
              <button
                onClick={() => setRemarkText(null)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Close
              </button>
            </div>
            <div className="rounded-lg bg-gray-1 px-4 py-4 text-sm text-dark dark:bg-dark-3 dark:text-white">
              {remarkText}
            </div>
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="z-20 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Order Details
                </h3>
                <p className="text-sm text-dark-5">
                  File # {details?.order.id ?? ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setDetails(null);
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-10 text-center text-dark-5">Loading order details...</div>
            ) : details ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <h4 className="mb-3 font-semibold text-dark dark:text-white">Order Details</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div><span className="text-dark-5">Assigned Supervisor</span><p className="font-medium text-dark dark:text-white">{details.order.supervisor_name || "—"}</p></div>
                    <div><span className="text-dark-5">Assigned Team Member</span><p className="font-medium text-dark dark:text-white">{details.order.team_member_name || "—"}</p></div>
                    <div><span className="text-dark-5">Order Type</span><p className="font-medium text-dark dark:text-white">{details.order.order_type || "—"}</p></div>
                    <div><span className="text-dark-5">REO Form</span><p className="font-medium text-dark dark:text-white">{details.order.reoform || "—"}</p></div>
                    <div><span className="text-dark-5">Non UAD</span><p className="font-medium text-dark dark:text-white">{details.order.non_uad || "—"}</p></div>
                    <div><span className="text-dark-5">Financing</span><p className="font-medium text-dark dark:text-white">{details.order.financing || "—"}</p></div>
                    <div><span className="text-dark-5">Borrower Name</span><p className="font-medium text-dark dark:text-white">{details.order.borrower_name || "—"}</p></div>
                    <div><span className="text-dark-5">Sketch</span><p className="font-medium text-dark dark:text-white">{details.order.sketch || "—"}</p></div>
                  </div>
                </div>

                <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <h4 className="mb-3 font-semibold text-dark dark:text-white">Subject Property Details</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div><span className="text-dark-5">Address</span><p className="font-medium text-dark dark:text-white">{details.order.subject_address || "—"}</p></div>
                    <div><span className="text-dark-5">State</span><p className="font-medium text-dark dark:text-white">{details.order.subject_state || "—"}</p></div>
                    <div><span className="text-dark-5">City</span><p className="font-medium text-dark dark:text-white">{details.order.subject_city || "—"}</p></div>
                    <div><span className="text-dark-5">Zip Code</span><p className="font-medium text-dark dark:text-white">{details.order.subject_zipcode || "—"}</p></div>
                    <div className="md:col-span-2"><span className="text-dark-5">Order Instructions</span><p className="font-medium text-dark dark:text-white">{details.order.description || "—"}</p></div>
                    <div className="md:col-span-2"><span className="text-dark-5">Standard Instructions</span><p className="font-medium text-dark dark:text-white">{details.order.standard_instruction || "—"}</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                    <h4 className="mb-3 font-semibold text-dark dark:text-white">Provided Attachments</h4>
                    {details.downloads.length ? (
                      <ul className="space-y-2 text-sm">
                        {details.downloads.map((item) => {
                          const href = getAttachmentLink(item.filepath);
                          return (
                            <li key={`download-${item.id}`} className="rounded-md bg-gray-1 px-3 py-2 dark:bg-dark-3">
                              <div className="font-medium text-dark dark:text-white">{item.filename || "Attachment"}</div>
                              <div className="text-dark-5">{item.type || "—"}</div>
                              {href && (
                                <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                                  Open file
                                </a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-dark-5">No downloads found here.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                    <h4 className="mb-3 font-semibold text-dark dark:text-white">Completed Work Attachments</h4>
                    {details.completedDownloads.length ? (
                      <ul className="space-y-2 text-sm">
                        {details.completedDownloads.map((item) => {
                          const href = getAttachmentLink(item.filepath);
                          return (
                            <li key={`completed-${item.id}`} className="rounded-md bg-gray-1 px-3 py-2 dark:bg-dark-3">
                              <div className="font-medium text-dark dark:text-white">{item.filename || "Attachment"}</div>
                              <div className="text-dark-5">{item.type || "—"}</div>
                              {href && (
                                <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                                  Open file
                                </a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-dark-5">No completed work attachments found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
