"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { standardFormat } from "@/lib/format-number";
import TablePagination from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PageMode = "pending" | "accepted";

type OrderRow = {
  id: number | string;
  package?: string;
  tat?: string;
  amount?: number | string;
  created_date?: string;
  status?: string;
  createdby?: string;
  client_name?: string;
  email?: string;
  subject_address?: string;
  reply?: string;
  remark?: string;
  emp_remark?: string;
  remaining_tat?: string;
  feedback_rating?: number | string;
  feedback?: string;
  assigner_name?: string;
  assigned_supervisor?: string;
  assigned_team_member?: string;
  uad_version?: string;
  non_uad?: string;
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
    subject_address?: string;
    standard_instruction?: string;
    description?: string;
    reply?: string;
    remark?: string;
    message?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

type SupervisorOption = {
  id: number | string;
  firstname?: string;
  lastname?: string;
  username?: string;
  emp_supervisor?: string;
};

type Props = {
  mode: PageMode;
};

const ITEMS_PER_PAGE = 10;

const DOC_OPTIONS = [
  "Template File",
  "Public Record File",
  "Market Conditions File",
  "MLS File",
  "Field Inspection",
  "Standard Instruction File",
];

const statusClasses: Record<string, string> = {
  Completed:
    "bg-green-light-6 text-green-700 dark:bg-green-dark/30 dark:text-green-light-4",
  Success:
    "bg-green-light-6 text-green-700 dark:bg-green-dark/30 dark:text-green-light-4",
  Pending:
    "bg-yellow-light-4 text-yellow-800 dark:bg-yellow-dark/30 dark:text-yellow-light-4",
  Accept:
    "bg-blue-light-5 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-light-4",
  Cancel:
    "bg-red-light-6 text-red-700 dark:bg-red-dark/30 dark:text-red-light-4",
  Reject:
    "bg-red-light-6 text-red-700 dark:bg-red-dark/30 dark:text-red-light-4",
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const formatTat = (value?: string) => {
  if (!value) {
    return "-";
  }

  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `${Number(trimmed)} Hours` : trimmed;
};

const exportRows = (rows: OrderRow[], filename: string) => {
  if (!rows.length) {
    window.alert("No order data available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "File#",
    "UAD Version",
    "TAT",
    "Credit",
    "Order Date",
    "Status",
    "Client Username",
    "Client Name",
    "Assigned",
    "Remaining TAT",
    "Property Address",
    "Reply",
    "Rating",
    "Feedback",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.id,
    row.uad_version || "",
    formatTat(row.package || row.tat),
    Number(row.amount ?? 0),
    formatDateTime(row.created_date),
    row.status || "",
    row.createdby || "",
    row.client_name || "",
    row.assigner_name || row.assigned_supervisor || row.assigned_team_member || "",
    row.remaining_tat || "",
    row.subject_address || "",
    row.reply || row.remark || "",
    row.feedback_rating ?? "",
    row.feedback || "",
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

const getSupervisorLabel = (supervisor?: SupervisorOption) => {
  if (!supervisor) {
    return "";
  }

  const fullName = `${supervisor.firstname ?? ""} ${supervisor.lastname ?? ""}`.trim();
  return fullName || supervisor.username || String(supervisor.id);
};

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-dark/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
          <h3 className="text-lg font-semibold text-dark dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stroke px-3 py-1 text-sm dark:border-dark-3"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function OrderWorkflowPage({ mode }: Props) {
  const { user } = useAuth();
  const normalizedRole = (user?.role ?? "").toLowerCase();
  const isSupervisorUser = normalizedRole === "supervisor";
  const isTeamMemberUser = normalizedRole === "team member";
  const isDirectTeamAcceptFlow = isTeamMemberUser && mode === "pending";
  const assignmentTargetLabel = isSupervisorUser ? "Team Member" : isDirectTeamAcceptFlow ? "Order" : "Supervisor";
  const assignmentCollectionLabel = isSupervisorUser ? "Team Members" : isDirectTeamAcceptFlow ? "Open Orders" : "Supervisors";

  const config =
    mode === "pending"
      ? {
          title: "New Orders",
          description: isSupervisorUser
            ? "Review new or reopened orders, add work notes, and assign them to your team members."
            : "Orders summary, reply flow, and accept / cancel actions for new or reopened orders.",
          statusQuery: "Pending,New Order,Reopen",
          cancelStatus: "Cancel",
          cancelActionText: "Cancel Order",
          assignText: isDirectTeamAcceptFlow ? "Accept Order" : "Accept & Assign",
          emptyMessage:
            "No pending or new orders were found in the live backend right now.",
          secondaryHref: isDirectTeamAcceptFlow ? "/orders/assigned-orders" : "/orders/accept-orders",
          secondaryLabel: isDirectTeamAcceptFlow ? "Open Assigned Orders" : "Open Accepted Orders",
        }
      : {
          title: "Accepted Orders",
          description:
            "Accepted orders summary with supervisor assignment and rejection flow.",
          statusQuery: "Accept",
          cancelStatus: "Reject",
          cancelActionText: "Reject Order",
          assignText: "Assign Order",
          emptyMessage: "No accepted orders matched the current filter.",
          secondaryHref: "/orders/new-order",
          secondaryLabel: "Open New Orders",
        };

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(mode === "accepted" && isSupervisorUser);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"overview" | "docs" | "instructions">(
    "overview",
  );
  const [details, setDetails] = useState<OrderDetailResponse | null>(null);

  const [replyOrder, setReplyOrder] = useState<OrderRow | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyDocs, setReplyDocs] = useState<string[]>([]);

  const [assignOrder, setAssignOrder] = useState<OrderRow | null>(null);
  const [assignSupervisorId, setAssignSupervisorId] = useState("");
  const [assignMessage, setAssignMessage] = useState("");
  const [assignDocs, setAssignDocs] = useState<string[]>([]);

  const [cancelOrder, setCancelOrder] = useState<OrderRow | null>(null);
  const [cancelRemark, setCancelRemark] = useState("");

  const currentAssigneeKeys = useMemo(
    () =>
      [user?.username, user?.email, `${user?.id ?? ""}`]
        .map((value) => `${value ?? ""}`.trim().toLowerCase())
        .filter(Boolean),
    [user?.email, user?.id, user?.username],
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/orders", {
        params: {
          status: config.statusQuery,
          unassignedOnly:
            !isSupervisorUser && mode === "accepted" && showOnlyUnassigned ? "true" : undefined,
          pageSize: "500",
        },
      });

      const payload = response.data;
      const rawRows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      const nextRows =
        isSupervisorUser && mode === "accepted" && showOnlyUnassigned
          ? rawRows.filter((order: OrderRow) => !`${order.assigned_team_member ?? ""}`.trim())
          : rawRows;

      setOrders(nextRows);
    } catch (error) {
      setOrders([]);
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load order records."),
      });
    } finally {
      setLoading(false);
    }
  }, [config.statusQuery, isSupervisorUser, mode, showOnlyUnassigned]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        if (isDirectTeamAcceptFlow) {
          setSupervisors([]);
          return;
        }

        const response = await axiosInstance.get("/user/employees", {
          params: { role: isSupervisorUser ? "Team Member" : "Supervisor" },
        });

        const next = (Array.isArray(response.data) ? response.data : []).filter(
          (item: SupervisorOption) => {
            if (!isSupervisorUser) {
              return true;
            }

            const manager = `${item.emp_supervisor ?? ""}`.trim().toLowerCase();
            return currentAssigneeKeys.includes(manager);
          },
        );

        setSupervisors(next);
      } catch {
        setSupervisors([]);
      }
    };

    void loadSupervisors();
  }, [currentAssigneeKeys, isDirectTeamAcceptFlow, isSupervisorUser]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return orders;
    }

    return orders.filter((order) => {
      const haystack = [
        String(order.id),
        order.createdby,
        order.client_name,
        order.subject_address,
        order.status,
        order.assigner_name,
        order.reply,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, orders]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredOrders]);

  const openDetails = async (
    orderId: number | string,
    tab: "overview" | "docs" | "instructions",
  ) => {
    setDetailsOpen(true);
    setDetailsTab(tab);
    setDetailsLoading(true);
    setDetails(null);

    try {
      const response = await axiosInstance.get(`/masters/reports/orders/${orderId}/details`);
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

  const handleSaveReply = async () => {
    if (!replyOrder) {
      return;
    }

    const docsText = replyDocs.length
      ? `Selected Documents: ${replyDocs.join(", ")}`
      : "";
    const nextReply = [replyMessage.trim(), docsText].filter(Boolean).join("\n\n").trim();

    if (!nextReply) {
      setMessage({ type: "error", text: "Please enter a message or select working documents." });
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.patch(`/masters/orders/${replyOrder.id}/reply`, {
        reply: nextReply,
      });

      setReplyOrder(null);
      setReplyMessage("");
      setReplyDocs([]);
      setMessage({ type: "success", text: `Message updated for file #${replyOrder.id}.` });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to save the reply message."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignOrder = async () => {
    if (!assignOrder) {
      return;
    }

    if (!isDirectTeamAcceptFlow && !assignSupervisorId) {
      setMessage({
        type: "error",
        text: `Please select a ${assignmentTargetLabel.toLowerCase()} first.`,
      });
      return;
    }

    if (!isDirectTeamAcceptFlow && mode === "pending" && assignDocs.length !== DOC_OPTIONS.length) {
      setMessage({
        type: "error",
        text: "Select all document files, then only you can accept the order.",
      });
      return;
    }

    const supervisor = supervisors.find(
      (item) => String(item.id) === String(assignSupervisorId),
    );
    const assignerName = getSupervisorLabel(supervisor);
    const docsText = assignDocs.length
      ? `Selected Documents: ${assignDocs.join(", ")}`
      : "";
    const nextReply = [assignMessage.trim(), docsText].filter(Boolean).join("\n\n").trim();

    setSubmitting(true);

    try {
      if (nextReply) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/reply`, {
          reply: nextReply,
        });
      }

      if (isDirectTeamAcceptFlow) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/status`, {
          status: "Accept",
        });
      } else if (isSupervisorUser) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-team-member`, {
          assigned_team_member: String(assignSupervisorId),
          assigner_name: assignerName,
          status: mode === "pending" ? "Accept" : undefined,
        });
      } else {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-supervisor`, {
          assigned_supervisor: String(assignSupervisorId),
          assigner_name: assignerName,
          status: mode === "pending" ? "Accept" : undefined,
        });
      }

      setAssignOrder(null);
      setAssignSupervisorId("");
      setAssignMessage("");
      setAssignDocs([]);
      setMessage({
        type: "success",
        text:
          mode === "pending"
            ? isDirectTeamAcceptFlow
              ? `Order #${assignOrder.id} has been accepted successfully.`
              : `Order #${assignOrder.id} has been accepted and assigned successfully.`
            : `Order #${assignOrder.id} has been assigned successfully.`,
      });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to assign the selected order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) {
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.patch(`/masters/orders/${cancelOrder.id}/status`, {
        status: config.cancelStatus,
        remark: cancelRemark.trim() || undefined,
      });

      setCancelOrder(null);
      setCancelRemark("");
      setMessage({
        type: "success",
        text: `Order #${cancelOrder.id} has been updated to ${config.cancelStatus}.`,
      });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, `Unable to ${config.cancelStatus.toLowerCase()} this order.`),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dark dark:text-white">{config.title}</h2>
          <p className="mt-1 text-sm text-dark-5">{config.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Refresh Data
          </button>

          <button
            type="button"
            onClick={() => exportRows(filteredOrders, `${config.title.replace(/\s+/g, "_")}.csv`)}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
          >
            Get Data (CSV)
          </button>

          <Link
            href={config.secondaryHref}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
          >
            {config.secondaryLabel}
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by file #, client, status, address"
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />

        {mode === "accepted" && (
          <label className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-3 text-sm dark:border-dark-3">
            <input
              type="checkbox"
              checked={showOnlyUnassigned}
              onChange={(event) => setShowOnlyUnassigned(event.target.checked)}
            />
            Show only unassigned
          </label>
        )}

        <div className="rounded-lg bg-gray-1 px-4 py-3 text-sm dark:bg-dark-2">
          <div className="text-dark-5">Order Count</div>
          <div className="font-semibold text-dark dark:text-white">{filteredOrders.length}</div>
        </div>

        <div className="rounded-lg bg-gray-1 px-4 py-3 text-sm dark:bg-dark-2">
          <div className="text-dark-5">{assignmentCollectionLabel}</div>
          <div className="font-semibold text-dark dark:text-white">{supervisors.length}</div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark dark:bg-green-dark/20 dark:text-green-light-4"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-[1700px]">
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:font-medium">
              <TableHead>Sr. No.</TableHead>
              <TableHead>File#</TableHead>
              <TableHead>UAD Version</TableHead>
              <TableHead>TAT</TableHead>
              {mode === "pending" && <TableHead>Credit</TableHead>}
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Client Username</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Remaining TAT</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>Working Docs</TableHead>
              {mode === "pending" && <TableHead>Reply</TableHead>}
              <TableHead>{config.assignText}</TableHead>
              <TableHead>{config.cancelActionText}</TableHead>
              <TableHead>{mode === "pending" ? "Client Instructions" : "Work Status"}</TableHead>
              {mode === "pending" && <TableHead>Rating</TableHead>}
              {mode === "pending" && <TableHead>Feedback</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={mode === "pending" ? 18 : 14}
                  className="py-8 text-center text-dark-5"
                >
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={mode === "pending" ? 18 : 14}
                  className="py-8 text-center text-dark-5"
                >
                  {config.emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order, index) => (
                <TableRow key={order.id} className="border-[#eee] text-sm dark:border-dark-3">
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell>
                    <Link href={`/orders/details/${order.id}`} className="font-medium text-primary underline">
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{order.uad_version || "-"}</TableCell>
                  <TableCell>{formatTat(order.package || order.tat)}</TableCell>
                  {mode === "pending" && (
                    <TableCell>${standardFormat(Number(order.amount ?? 0))}</TableCell>
                  )}
                  <TableCell>{formatDateTime(order.created_date)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status || ""] || "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white"}`}
                    >
                      {order.status || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{order.createdby || "-"}</TableCell>
                  <TableCell>{order.client_name || "-"}</TableCell>
                  <TableCell>
                    {order.assigner_name || order.assigned_supervisor || order.assigned_team_member || "-"}
                  </TableCell>
                  <TableCell>{order.remaining_tat || "-"}</TableCell>
                  <TableCell className="max-w-[220px] whitespace-normal">
                    {order.subject_address || "-"}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => void openDetails(order.id, "docs")}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
                    >
                      View Docs
                    </button>
                  </TableCell>
                  {mode === "pending" && (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyOrder(order);
                          setReplyMessage(order.reply || "");
                          setReplyDocs([]);
                        }}
                        className="rounded-md bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600"
                      >
                        Message
                      </button>
                      <div className="mt-1 max-w-[180px] truncate text-xs text-dark-5">
                        {order.reply || "No reply yet."}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignOrder(order);
                        setAssignSupervisorId("");
                        setAssignMessage(order.reply || "");
                        setAssignDocs([]);
                      }}
                      className="rounded-md bg-green px-3 py-1 text-xs font-medium text-white hover:bg-green/90"
                    >
                      {config.assignText}
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelOrder(order);
                        setCancelRemark(order.remark || "");
                      }}
                      className="rounded-md bg-red px-3 py-1 text-xs font-medium text-white hover:bg-red/90"
                    >
                      {config.cancelActionText}
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => void openDetails(order.id, "instructions")}
                      className="rounded-md border border-stroke px-3 py-1 text-xs font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                    >
                      View
                    </button>
                  </TableCell>
                  {mode === "pending" && <TableCell>{order.feedback_rating ?? "-"}</TableCell>}
                  {mode === "pending" && (
                    <TableCell className="max-w-[220px] whitespace-normal">
                      {order.feedback || "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        label="orders"
      />

      {detailsOpen && (
        <ModalShell
          title={`Order Details${details?.order?.id ? ` - File #${details.order.id}` : ""}`}
          onClose={() => setDetailsOpen(false)}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetailsTab("overview")}
              className={`rounded-md px-3 py-1 text-sm ${detailsTab === "overview" ? "bg-primary text-white" : "border border-stroke dark:border-dark-3"}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setDetailsTab("docs")}
              className={`rounded-md px-3 py-1 text-sm ${detailsTab === "docs" ? "bg-primary text-white" : "border border-stroke dark:border-dark-3"}`}
            >
              Working Docs
            </button>
            <button
              type="button"
              onClick={() => setDetailsTab("instructions")}
              className={`rounded-md px-3 py-1 text-sm ${detailsTab === "instructions" ? "bg-primary text-white" : "border border-stroke dark:border-dark-3"}`}
            >
              Instructions
            </button>
          </div>

          {detailsLoading ? (
            <p className="text-sm text-dark-5">Loading order details...</p>
          ) : !details ? (
            <p className="text-sm text-dark-5">No detail data found.</p>
          ) : detailsTab === "docs" ? (
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 font-semibold text-dark dark:text-white">Downloads</h4>
                {details.downloads.length ? (
                  <div className="space-y-2">
                    {details.downloads.map((item) => (
                      <div key={`download-${item.id}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="font-medium text-dark dark:text-white">{item.type || "Document"}</div>
                        <div className="text-sm text-dark-5">{item.filename || "Unnamed file"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-5">No working docs found.</p>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-dark dark:text-white">Completed Downloads</h4>
                {details.completedDownloads.length ? (
                  <div className="space-y-2">
                    {details.completedDownloads.map((item) => (
                      <div key={`completed-${item.id}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="font-medium text-dark dark:text-white">{item.type || "Completed Document"}</div>
                        <div className="text-sm text-dark-5">{item.filename || "Unnamed file"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-5">No completed download files found.</p>
                )}
              </div>
            </div>
          ) : detailsTab === "instructions" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2">
                <div className="mb-2 font-semibold text-dark dark:text-white">Order Description</div>
                <div className="whitespace-pre-wrap text-dark-5">{details.order.description || "No description provided."}</div>
              </div>
              <div className="rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2">
                <div className="mb-2 font-semibold text-dark dark:text-white">Standard Instruction</div>
                <div className="whitespace-pre-wrap text-dark-5">
                  {details.order.standard_instruction || "No special instructions available."}
                </div>
              </div>
              <div className="rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2">
                <div className="mb-2 font-semibold text-dark dark:text-white">Reply / Work Status</div>
                <div className="whitespace-pre-wrap text-dark-5">{details.order.reply || details.order.remark || "No work status available yet."}</div>
              </div>
              <div className="rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2">
                <div className="mb-2 font-semibold text-dark dark:text-white">Client Message</div>
                <div className="whitespace-pre-wrap text-dark-5">{details.order.message || "No client message."}</div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="text-sm text-dark-5">Client</div>
                <div className="font-medium text-dark dark:text-white">{details.order.client_name || "-"}</div>
              </div>
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="text-sm text-dark-5">User Name</div>
                <div className="font-medium text-dark dark:text-white">{details.order.createdby || "-"}</div>
              </div>
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="text-sm text-dark-5">Status</div>
                <div className="font-medium text-dark dark:text-white">{details.order.status || "-"}</div>
              </div>
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="text-sm text-dark-5">Supervisor</div>
                <div className="font-medium text-dark dark:text-white">{details.order.supervisor_name || "-"}</div>
              </div>
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3 sm:col-span-2">
                <div className="text-sm text-dark-5">Property Address</div>
                <div className="font-medium text-dark dark:text-white">{details.order.subject_address || "-"}</div>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {replyOrder && (
        <ModalShell title={`Send Message - File #${replyOrder.id}`} onClose={() => setReplyOrder(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Message</label>
              <textarea
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                rows={6}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                placeholder="Enter the message for this order"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Working Docs</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DOC_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                    <input
                      type="checkbox"
                      checked={replyDocs.includes(item)}
                      onChange={(event) => {
                        setReplyDocs((prev) =>
                          event.target.checked
                            ? [...prev, item]
                            : prev.filter((doc) => doc !== item),
                        );
                      }}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReplyOrder(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleSaveReply()}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : "Send Message"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {assignOrder && (
        <ModalShell title={`${config.assignText} - File #${assignOrder.id}`} onClose={() => setAssignOrder(null)}>
          <div className="space-y-4">
            {!isDirectTeamAcceptFlow && (
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Select {assignmentTargetLabel}</label>
                <select
                  value={assignSupervisorId}
                  onChange={(event) => setAssignSupervisorId(event.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                >
                  <option value="">Select {assignmentTargetLabel}</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={String(supervisor.id)}>
                      {getSupervisorLabel(supervisor)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Message / Work Status</label>
              <textarea
                value={assignMessage}
                onChange={(event) => setAssignMessage(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                placeholder="Add optional notes or work status"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Required Working Docs</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DOC_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                    <input
                      type="checkbox"
                      checked={assignDocs.includes(item)}
                      onChange={(event) => {
                        setAssignDocs((prev) =>
                          event.target.checked
                            ? [...prev, item]
                            : prev.filter((doc) => doc !== item),
                        );
                      }}
                    />
                    {item}
                  </label>
                ))}
              </div>
              {mode === "pending" && !isDirectTeamAcceptFlow && (
                <p className="mt-2 text-xs text-dark-5">All six document options must be selected before the order can be accepted and assigned.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignOrder(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleAssignOrder()}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : config.assignText}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {cancelOrder && (
        <ModalShell title={`${config.cancelActionText} - File #${cancelOrder.id}`} onClose={() => setCancelOrder(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Remark</label>
              <textarea
                value={cancelRemark}
                onChange={(event) => setCancelRemark(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                placeholder="Enter a remark for this action"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelOrder(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={submitting}
                className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : config.cancelActionText}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
