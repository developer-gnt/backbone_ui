"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { getAttachmentUrl as getAttachmentLink } from "@/lib/attachmentUrl";
import { standardFormat } from "@/lib/format-number";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderWorkflowPage from "../_components/order-workflow-page";

type OrderRow = {
  id: number | string;
  package?: string;
  amount?: number | string;
  created_date?: string;
  status?: string;
  createdby?: string;
  client_name?: string;
  subject_address?: string;
  reply?: string;
  remark?: string;
  remaining_tat?: string;
  feedback_rating?: number | string;
  feedback?: string;
  assigner_name?: string;
  assigned_supervisor?: string;
  assigned_team_member?: string;
};

type SupervisorOption = {
  id: number | string;
  firstname?: string;
  lastname?: string;
  username?: string;
  emp_supervisor?: string;
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
    description?: string;
    standard_instruction?: string;
    reply?: string;
    remark?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

const DOC_OPTIONS = [
  "Template File",
  "Public Record File",
  "Market Conditions File",
  "MLS File",
  "Field Inspection",
  "Standard Instruction File",
];

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getSupervisorLabel = (item?: SupervisorOption) => {
  if (!item) return "";
  const fullName = `${item.firstname ?? ""} ${item.lastname ?? ""}`.trim();
  return fullName || item.username || String(item.id);
};

const exportRows = (rows: OrderRow[]) => {
  if (!rows.length) {
    window.alert("No New Orders Found.... !");
    return;
  }

  const headers = [
    "Sr. No.",
    "File#",
    "TAT",
    "credit",
    "Order Date",
    "Status",
    "Client UserName",
    "Client Name",
    "Assigned",
    "Remaining TAT",
    "Property Address",
    "Client Rating",
    "Client Feedback",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.id,
    row.package || "",
    Number(row.amount ?? 0),
    formatDateTime(row.created_date),
    row.status || "",
    row.createdby || "",
    row.client_name || "",
    row.assigner_name || row.assigned_supervisor || row.assigned_team_member || "",
    row.remaining_tat || "",
    row.subject_address || "",
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
  link.download = `Orders_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

function ModalShell({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

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

function LegacyAdminNewOrdersPage() {
  const { user } = useAuth();
  const normalizedRole = `${user?.role ?? ""}`.trim().toLowerCase();
  const isSupervisorUser = normalizedRole === "supervisor";
  const currentAssigneeKeys = useMemo(
    () =>
      [
        user?.username,
        user?.email,
        `${user?.id ?? ""}`,
        user?.firstname,
        user?.lastname,
        `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim(),
      ]
        .map((value) => `${value ?? ""}`.trim().toLowerCase())
        .filter(Boolean),
    [user?.email, user?.id, user?.username, user?.firstname, user?.lastname],
  );
  const showCreditAndFeedback = !isSupervisorUser;
  const tableColSpan = showCreditAndFeedback ? 18 : 15;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    scrollRef.current.classList.add("cursor-grabbing", "select-none");
    scrollRef.current.classList.remove("cursor-grab");
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    if (scrollRef.current) {
      scrollRef.current.classList.remove("cursor-grabbing", "select-none");
      scrollRef.current.classList.add("cursor-grab");
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (scrollRef.current) {
      scrollRef.current.classList.remove("cursor-grabbing", "select-none");
      scrollRef.current.classList.add("cursor-grab");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [replyOrder, setReplyOrder] = useState<OrderRow | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [acceptOrder, setAcceptOrder] = useState<OrderRow | null>(null);
  const [acceptDocs, setAcceptDocs] = useState<string[]>([]);
  const [acceptMessage, setAcceptMessage] = useState("");

  const [assignOrder, setAssignOrder] = useState<OrderRow | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  const [cancelOrder, setCancelOrder] = useState<OrderRow | null>(null);
  const [cancelRemark, setCancelRemark] = useState("");

  const [detailMode, setDetailMode] = useState<"downloads" | "instructions" | null>(null);
  const [details, setDetails] = useState<OrderDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const selectedSupervisorLabel = useMemo(() => {
    const selected = supervisors.find(
      (item) => String(item.id) === String(selectedSupervisorId),
    );
    return getSupervisorLabel(selected);
  }, [selectedSupervisorId, supervisors]);

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/masters/reports/orders", {
        params: { pageSize: "500", _t: Date.now() },
      });

      const payload = response.data;
      const rawRows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      const nextRows = rawRows.filter((order: OrderRow) => {
        const status = `${order.status ?? ""}`.trim().toLowerCase();
        return status !== "accept" && status !== "accepted";
      });

      setOrders(nextRows);
    } catch (error) {
      setOrders([]);
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load new orders."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupervisors = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/user/employees", {
        params: { role: isSupervisorUser ? "Team Member" : "Supervisor" },
      });

      const nextRows = Array.isArray(response.data) ? response.data : [];
      setSupervisors(nextRows);
    } catch {
      setSupervisors([]);
    }
  }, [isSupervisorUser]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadSupervisors();
  }, [loadSupervisors]);

  const openDetailModal = async (
    orderId: number | string,
    mode: "downloads" | "instructions",
  ) => {
    setDetailMode(mode);
    setDetailsLoading(true);
    setDetails(null);

    try {
      const response = await axiosInstance.get(
        `/masters/reports/orders/${orderId}/details`,
      );
      setDetails(response.data);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load order details."),
      });
      setDetailMode(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReplySend = async () => {
    if (!replyOrder || !replyMessage.trim()) {
      setMessage({ type: "error", text: "Please enter a message first." });
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${replyOrder.id}/reply`, {
        reply: replyMessage.trim(),
      });

      setReplyOrder(null);
      setReplyMessage("");
      setMessage({ type: "success", text: "Reply Sent Successfully!" });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to send the reply."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptMessageSend = async () => {
    if (!acceptOrder) {
      return;
    }

    const selectedDocsText = acceptDocs.length
      ? `Selected Documents: ${acceptDocs.join(", ")}`
      : "";
    const nextReply = [acceptMessage.trim(), selectedDocsText]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!nextReply) {
      setMessage({
        type: "error",
        text: "Please enter a message or select working docs first.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${acceptOrder.id}/reply`, {
        reply: nextReply,
      });
      setMessage({ type: "success", text: "Reply Sent Successfully!" });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to send the order message."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignOrder = async () => {
    if (!assignOrder) return;

    if (acceptDocs.length !== DOC_OPTIONS.length) {
      setMessage({
        type: "error",
        text: "Select all document files then only you can accept order.",
      });
      return;
    }

    if (!selectedSupervisorId) {
      setMessage({
        type: "error",
        text: isSupervisorUser ? "Please select team member first." : "Please select supervisor first.",
      });
      return;
    }

    const selectedDocsText = acceptDocs.length
      ? `Selected Documents: ${acceptDocs.join(", ")}`
      : "";
    const nextReply = [acceptMessage.trim(), selectedDocsText]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    setSubmitting(true);
    try {
      if (nextReply) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/reply`, {
          reply: nextReply,
        });
      }

      if (isSupervisorUser) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-team-member`, {
          assigned_team_member: selectedSupervisorId,
          assigner_name: selectedSupervisorLabel,
          status: "Accept",
        });
      } else {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-supervisor`, {
          assigned_supervisor: selectedSupervisorId,
          assigner_name: selectedSupervisorLabel,
          status: "Accept",
        });
      }

      setOrders((prev) => prev.filter((o) => o.id !== assignOrder.id));
      setAssignOrder(null);
      setAcceptOrder(null);
      setAcceptDocs([]);
      setAcceptMessage("");
      setSelectedSupervisorId("");
      setMessage({
        type: "success",
        text: "Order has been successfully accepted and assigned",
      });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to assign the order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${cancelOrder.id}/status`, {
        status: "Cancel",
        remark: cancelRemark.trim() || undefined,
      });

      setCancelOrder(null);
      setCancelRemark("");
      setMessage({
        type: "success",
        text: "Order has been cancelled successfully",
      });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to cancel the order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-sm text-dark-5">Overview</div>
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            New orders
          </h2>
          <p className="mt-1 text-sm text-dark-5">
            Orders summary,order assigning to Backbone Data Solutions employees
          </p>
          <p
            className={`mt-3 text-base ${message?.type === "error" ? "text-red-500" : "text-green-600"
              }`}
          >
            {message?.text || ""}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => exportRows(orders)}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Get Data
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="overflow-auto max-h-[calc(100vh-320px)] cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <Table className="min-w-[1700px]">
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:font-medium [&>th]:text-dark [&>th]:dark:text-white sticky top-0 z-10">
              <TableHead>Sr. No.</TableHead>
              <TableHead>File#</TableHead>
              <TableHead>TAT</TableHead>
              {showCreditAndFeedback && <TableHead>Credit</TableHead>}
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Client Email</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Remaining TAT</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Working Docs</TableHead>
              <TableHead>Reply</TableHead>
              <TableHead>Accept</TableHead>
              <TableHead>Cancel</TableHead>
              <TableHead>Client Special Instructions</TableHead>
              {showCreditAndFeedback && <TableHead>Client Rating</TableHead>}
              {showCreditAndFeedback && <TableHead>Client Feedback</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={tableColSpan} className="py-8 text-center text-dark-5">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColSpan} className="py-8 text-center text-dark-5">
                  No New Orders Found.... !
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => {
                const packageValue = `${order.package ?? ""}`.trim();
                const rowClassName =
                  packageValue === "04"
                    ? "text-red-600 font-semibold"
                    : packageValue === "06"
                      ? "text-blue-600 font-semibold"
                      : packageValue === "12"
                        ? "text-green-600 font-semibold"
                        : "";

                return (
                  <TableRow key={order.id} className={`border-[#eee] dark:border-dark-3 ${rowClassName}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/orders/details/${order.id}`}
                        className="underline decoration-primary text-primary"
                      >
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell>{order.package || "-"}</TableCell>
                    {showCreditAndFeedback && (
                      <TableCell>${standardFormat(Number(order.amount ?? 0))}</TableCell>
                    )}
                    <TableCell>{formatDateTime(order.created_date)}</TableCell>
                    <TableCell>{order.status || "-"}</TableCell>
                    <TableCell>{order.createdby || "-"}</TableCell>
                    <TableCell>{order.client_name || "-"}</TableCell>
                    <TableCell>{order.remaining_tat || "-"}</TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">
                      {order.subject_address || "-"}
                    </TableCell>
                    <TableCell>
                      {order.assigner_name || order.assigned_supervisor || order.assigned_team_member || "-"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded bg-primary px-3 py-1 text-xs text-white hover:bg-primary/90"
                        onClick={() => void openDetailModal(order.id, "downloads")}
                      >
                        View
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded bg-yellow-500 px-3 py-1 text-xs text-white hover:bg-yellow-600"
                        onClick={() => {
                          setReplyOrder(order);
                          setReplyMessage(order.reply || "");
                        }}
                      >
                        Reply
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded bg-green px-3 py-1 text-xs text-white hover:bg-green/90"
                        onClick={() => {
                          setAcceptOrder(order);
                          setAcceptDocs([]);
                          setAcceptMessage(order.reply || "");
                        }}
                      >
                        Accept
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded bg-red px-3 py-1 text-xs text-white hover:bg-red/90"
                        onClick={() => {
                          setCancelOrder(order);
                          setCancelRemark(order.remark || "");
                        }}
                      >
                        Cancel
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded border border-stroke px-3 py-1 text-xs hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                        onClick={() => void openDetailModal(order.id, "instructions")}
                      >
                        View
                      </button>
                    </TableCell>
                    {showCreditAndFeedback && <TableCell>{order.feedback_rating ?? "-"}</TableCell>}
                    {showCreditAndFeedback && (
                      <TableCell className="max-w-[220px] whitespace-normal">
                        {order.feedback || "-"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ModalShell
        title={`Send Message${replyOrder?.id ? ` - File #${replyOrder.id}` : ""}`}
        open={Boolean(replyOrder)}
        onClose={() => setReplyOrder(null)}
      >
        <div className="space-y-4">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-stroke px-4 py-3 dark:border-dark-3 dark:bg-dark-2"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setReplyOrder(null)}
              className="rounded border border-stroke px-4 py-2 dark:border-dark-3"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => void handleReplySend()}
              disabled={submitting}
              className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        title={`Accept Order${acceptOrder?.id ? ` - File #${acceptOrder.id}` : ""}`}
        open={Boolean(acceptOrder)}
        onClose={() => setAcceptOrder(null)}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            {DOC_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                <input
                  type="checkbox"
                  checked={acceptDocs.includes(item)}
                  onChange={(event) => {
                    setAcceptDocs((prev) =>
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

          <div className="space-y-3">
            <input
              value={acceptOrder?.id ?? ""}
              readOnly
              className="w-full rounded border border-stroke px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            />
            <textarea
              value={acceptMessage}
              onChange={(e) => setAcceptMessage(e.target.value)}
              rows={6}
              className="w-full rounded border border-stroke px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            />
            <button
              type="button"
              onClick={() => void handleAcceptMessageSend()}
              disabled={submitting}
              className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              Send Message
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (!acceptOrder) return;
              setAssignOrder(acceptOrder);
              setSelectedSupervisorId("");
              setAcceptOrder(null);
            }}
            className="rounded border border-stroke px-4 py-2 dark:border-dark-3"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => setAcceptOrder(null)}
            className="rounded border border-stroke px-4 py-2 dark:border-dark-3"
          >
            Close
          </button>
        </div>
      </ModalShell>

      <ModalShell
        title={`Assign Order${assignOrder?.id ? ` - File #${assignOrder.id}` : ""}`}
        open={Boolean(assignOrder)}
        onClose={() => setAssignOrder(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              {isSupervisorUser ? "Select Team Member" : "Select Supervisor"}
            </label>
            <select
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="w-full rounded border border-stroke px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            >
              <option value="">{isSupervisorUser ? "Select Team Member" : "Select Supervisor"}</option>
              {supervisors.map((item) => (
                <option key={item.id} value={item.id}>
                  {getSupervisorLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => void handleAssignOrder()}
              disabled={submitting}
              className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? "Assigning..." : "Assign Order"}
            </button>
            <button
              type="button"
              onClick={() => setAssignOrder(null)}
              className="rounded border border-stroke px-4 py-2 dark:border-dark-3"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        title={`Cancel Order${cancelOrder?.id ? ` - File #${cancelOrder.id}` : ""}`}
        open={Boolean(cancelOrder)}
        onClose={() => setCancelOrder(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Enter Remark For Cancellation
            </label>
            <textarea
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              rows={5}
              className="w-full rounded border border-stroke px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => void handleCancelOrder()}
              disabled={submitting}
              className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? "Cancelling..." : "Cancel Order"}
            </button>
            <button
              type="button"
              onClick={() => setCancelOrder(null)}
              className="rounded border border-stroke px-4 py-2 dark:border-dark-3"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        title={`WORKING DOCS DOWNLOADS${details?.order?.id ? ` - File #${details.order.id}` : ""}`}
        open={detailMode === "downloads"}
        onClose={() => setDetailMode(null)}
      >
        {detailsLoading ? (
          <p className="text-sm text-dark-5">Loading downloads...</p>
        ) : !details?.downloads?.length ? (
          <p className="text-sm text-dark-5">No downloads found here !</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border border-stroke text-sm dark:border-dark-3">
              <thead>
                <tr className="bg-gray-1 dark:bg-dark-2">
                  <th className="border border-stroke px-3 py-2 text-left dark:border-dark-3">Type</th>
                  <th className="border border-stroke px-3 py-2 text-left dark:border-dark-3">FileName</th>
                  <th className="border border-stroke px-3 py-2 text-left dark:border-dark-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {details.downloads.map((item) => {
                  const href = getAttachmentLink(item.filepath);
                  return (
                    <tr key={item.id}>
                      <td className="border border-stroke px-3 py-2 dark:border-dark-3">{item.type || "-"}</td>
                      <td className="border border-stroke px-3 py-2 dark:border-dark-3">{item.filename || "-"}</td>
                      <td className="border border-stroke px-3 py-2 dark:border-dark-3">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            Download
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModalShell>

      <ModalShell
        title="Working Special Instructions"
        open={detailMode === "instructions"}
        onClose={() => setDetailMode(null)}
      >
        {detailsLoading ? (
          <p className="text-sm text-dark-5">Loading instructions...</p>
        ) : (
          <div>
            <p className="mb-3 text-sm text-dark dark:text-white">
              Please Find out your WORKING Special Instruction
            </p>
            <div className="rounded bg-gray-1 p-4 text-sm dark:bg-dark-2">
              {details?.order?.description ||
                details?.order?.standard_instruction ||
                details?.order?.reply ||
                details?.order?.remark ||
                "No special instructions available."}
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}

function LegacyTeamMemberNewOrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [replyOrder, setReplyOrder] = useState<OrderRow | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [acceptOrder, setAcceptOrder] = useState<OrderRow | null>(null);
  const [acceptDocs, setAcceptDocs] = useState<string[]>([]);
  const [acceptMessage, setAcceptMessage] = useState("");

  const [cancelOrder, setCancelOrder] = useState<OrderRow | null>(null);
  const [cancelRemark, setCancelRemark] = useState("");

  const [detailMode, setDetailMode] = useState<"downloads" | "instructions" | null>(null);
  const [details, setDetails] = useState<OrderDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/masters/reports/orders", {
        params: { status: "Pending,New Order,Reopen", pageSize: "500" },
      });
      const payload = response.data;
      const nextRows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setOrders(nextRows);
    } catch (error) {
      setOrders([]);
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to load new orders.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openDetailModal = async (orderId: number | string, mode: "downloads" | "instructions") => {
    setDetailMode(mode);
    setDetailsLoading(true);
    setDetails(null);
    try {
      const response = await axiosInstance.get(`/masters/reports/orders/${orderId}/details`);
      setDetails(response.data);
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to load order details.") });
      setDetailMode(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReplySend = async () => {
    if (!replyOrder || !replyMessage.trim()) {
      setMessage({ type: "error", text: "Please enter a message first." });
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${replyOrder.id}/reply`, { reply: replyMessage.trim() });
      setReplyOrder(null);
      setReplyMessage("");
      setMessage({ type: "success", text: "Reply Sent Successfully!" });
      await loadOrders();
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to send the reply.") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptMessageSend = async () => {
    if (!acceptOrder) return;
    const selectedDocsText = acceptDocs.length ? `Selected Documents: ${acceptDocs.join(", ")}` : "";
    const nextReply = [acceptMessage.trim(), selectedDocsText].filter(Boolean).join("\n\n").trim();
    if (!nextReply) {
      setMessage({ type: "error", text: "Please enter a message or select working docs first." });
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${acceptOrder.id}/reply`, { reply: nextReply });
      setMessage({ type: "success", text: "Reply Sent Successfully!" });
      await loadOrders();
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to send the order message.") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!acceptOrder) return;
    const selectedDocsText = acceptDocs.length ? `Selected Documents: ${acceptDocs.join(", ")}` : "";
    const nextReply = [acceptMessage.trim(), selectedDocsText].filter(Boolean).join("\n\n").trim();
    setSubmitting(true);
    try {
      if (nextReply) {
        await axiosInstance.patch(`/masters/orders/${acceptOrder.id}/reply`, { reply: nextReply });
      }
      await axiosInstance.patch(`/masters/orders/${acceptOrder.id}/status`, { status: "Accept" });
      setOrders((prev) =>
        prev.map((row) => String(row.id) === String(acceptOrder.id) ? { ...row, status: "Accept" } : row),
      );
      setAcceptOrder(null);
      setAcceptDocs([]);
      setAcceptMessage("");
      setMessage({ type: "success", text: "Order has been successfully accepted" });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to accept the order.") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${cancelOrder.id}/status`, {
        status: "Cancel",
        remark: cancelRemark.trim() || undefined,
      });
      setOrders((prev) =>
        prev.map((row) => String(row.id) === String(cancelOrder.id) ? { ...row, status: "Cancel" } : row),
      );
      setCancelOrder(null);
      setCancelRemark("");
      setMessage({ type: "success", text: "Order has been cancelled successfully" });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error, "Unable to cancel the order.") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-sm text-dark-5">Overview</div>
          <h2 className="text-xl font-semibold text-dark dark:text-white">New Orders</h2>
          <p className="mt-1 text-sm text-dark-5">Orders summary — accept or cancel new / reopened orders</p>
          {message && (
            <p className={`mt-3 text-sm ${message.type === "error" ? "text-red-500" : "text-green-600"}`}>
              {message.text}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportRows(orders)}
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
        >
          Get Data
        </button>
      </div>

      <div className="overflow-auto rounded-lg border border-stroke dark:border-dark-3">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:font-medium [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead>Sr. No.</TableHead>
              <TableHead>File#</TableHead>
              <TableHead>TAT</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remaining TAT</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Working Docs</TableHead>
              <TableHead>Reply</TableHead>
              <TableHead>Accept</TableHead>
              <TableHead>Cancel</TableHead>
              <TableHead>Client Special Instructions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-dark-5">Loading orders...</TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-dark-5">No Data Found !</TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => {
                const pkg = `${order.package ?? ""}`.trim();
                const rowClassName =
                  pkg === "04" ? "text-red-600 font-semibold" :
                    pkg === "06" ? "text-blue-600 font-semibold" :
                      pkg === "12" ? "text-green-600 font-semibold" : "";
                return (
                  <TableRow key={order.id} className={`border-[#eee] dark:border-dark-3 ${rowClassName}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link href={`/orders/details/${order.id}`} className="text-primary underline decoration-primary">
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell>{order.package || "-"}</TableCell>
                    <TableCell>{formatDateTime(order.created_date)}</TableCell>
                    <TableCell>{order.status || "-"}</TableCell>
                    <TableCell>{order.remaining_tat || "-"}</TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">{order.subject_address || "-"}</TableCell>
                    <TableCell>{order.assigner_name || order.assigned_supervisor || order.assigned_team_member || "-"}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void openDetailModal(order.id, "downloads")}
                        className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
                      >
                        View Docs
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => { setReplyOrder(order); setReplyMessage(order.reply || ""); }}
                        className="rounded-md bg-yellow-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-yellow-600"
                      >
                        Reply
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => { setAcceptOrder(order); setAcceptDocs([]); setAcceptMessage(order.reply || ""); }}
                        className="rounded-md bg-green px-2.5 py-1 text-[11px] font-medium text-white hover:bg-green/90"
                      >
                        Accept
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => { setCancelOrder(order); setCancelRemark(order.remark || ""); }}
                        className="rounded-md bg-red px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red/90"
                      >
                        Cancel
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void openDetailModal(order.id, "instructions")}
                        className="rounded-md border border-stroke px-2.5 py-1 text-[11px] font-medium hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reply modal */}
      <ModalShell
        title={`Send Message${replyOrder?.id ? ` - File #${replyOrder.id}` : ""}`}
        open={Boolean(replyOrder)}
        onClose={() => setReplyOrder(null)}
      >
        <div className="space-y-4">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-stroke px-4 py-3 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setReplyOrder(null)}
              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium dark:border-dark-3">Close</button>
            <button type="button" onClick={() => void handleReplySend()} disabled={submitting}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Accept modal */}
      <ModalShell
        title={`Accept Order${acceptOrder?.id ? ` - File #${acceptOrder.id}` : ""}`}
        open={Boolean(acceptOrder)}
        onClose={() => setAcceptOrder(null)}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            {DOC_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                <input
                  type="checkbox"
                  checked={acceptDocs.includes(item)}
                  onChange={(event) => {
                    setAcceptDocs((prev) =>
                      event.target.checked ? [...prev, item] : prev.filter((d) => d !== item),
                    );
                  }}
                />
                {item}
              </label>
            ))}
          </div>
          <div className="space-y-3">
            <input
              value={acceptOrder?.id ?? ""}
              readOnly
              className="w-full rounded border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <textarea
              value={acceptMessage}
              onChange={(e) => setAcceptMessage(e.target.value)}
              rows={5}
              className="w-full rounded border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              placeholder="Optional message to client"
            />
            <button
              type="button"
              onClick={() => void handleAcceptMessageSend()}
              disabled={submitting}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              Send Message
            </button>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setAcceptOrder(null)}
            className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium dark:border-dark-3">Close</button>
          <button type="button" onClick={() => void handleAcceptOrder()} disabled={submitting}
            className="rounded-md bg-green px-3 py-1.5 text-xs font-medium text-white hover:bg-green/90 disabled:opacity-60">
            {submitting ? "Accepting..." : "Accept Order"}
          </button>
        </div>
      </ModalShell>

      {/* Cancel modal */}
      <ModalShell
        title={`Cancel Order${cancelOrder?.id ? ` - File #${cancelOrder.id}` : ""}`}
        open={Boolean(cancelOrder)}
        onClose={() => setCancelOrder(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Enter Remark For Cancellation</label>
            <textarea
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              rows={5}
              className="w-full rounded border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCancelOrder(null)}
              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium dark:border-dark-3">Close</button>
            <button type="button" onClick={() => void handleCancelOrder()} disabled={submitting}
              className="rounded-md bg-red px-3 py-1.5 text-xs font-medium text-white hover:bg-red/90 disabled:opacity-60">
              {submitting ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Working Docs modal */}
      <ModalShell
        title={`WORKING DOCS DOWNLOADS${details?.order?.id ? ` - File #${details.order.id}` : ""}`}
        open={detailMode === "downloads"}
        onClose={() => setDetailMode(null)}
      >
        {detailsLoading ? (
          <p className="text-sm text-dark-5">Loading downloads...</p>
        ) : !details?.downloads?.length ? (
          <p className="text-sm text-dark-5">No downloads found here !</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border border-stroke text-sm dark:border-dark-3">
              <thead>
                <tr className="bg-gray-1 dark:bg-dark-2">
                  <th className="border border-stroke px-3 py-2 text-left dark:border-dark-3">Type</th>
                  <th className="border border-stroke px-3 py-2 text-left dark:border-dark-3">FileName</th>
                  <th className="border border-stroke px-3 py-2 text-left dark:border-dark-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {details.downloads.map((item) => {
                  const href = getAttachmentLink(item.filepath);
                  return (
                    <tr key={item.id}>
                      <td className="border border-stroke px-3 py-2 dark:border-dark-3">{item.type || "-"}</td>
                      <td className="border border-stroke px-3 py-2 dark:border-dark-3">{item.filename || "-"}</td>
                      <td className="border border-stroke px-3 py-2 dark:border-dark-3">
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">Download</a>
                        ) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModalShell>

      {/* Instructions modal */}
      <ModalShell
        title="Working Special Instructions"
        open={detailMode === "instructions"}
        onClose={() => setDetailMode(null)}
      >
        {detailsLoading ? (
          <p className="text-sm text-dark-5">Loading instructions...</p>
        ) : (
          <div>
            <p className="mb-3 text-sm text-dark dark:text-white">Please Find out your WORKING Special Instruction</p>
            <div className="rounded bg-gray-1 p-4 text-sm dark:bg-dark-2">
              {details?.order?.description || details?.order?.standard_instruction || details?.order?.reply || details?.order?.remark || "No special instructions available."}
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}

export default function Page() {
  const { user } = useAuth();
  const normalizedRole = `${user?.role ?? ""}`.trim().toLowerCase();

  if (normalizedRole === "team member") {
    return <LegacyTeamMemberNewOrdersPage />;
  }

  return <LegacyAdminNewOrdersPage />;
}

