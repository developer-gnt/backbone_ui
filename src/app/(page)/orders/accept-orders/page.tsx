"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { getAttachmentUrl as getAttachmentLink } from "@/lib/attachmentUrl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";
import OrderWorkflowPage from "../_components/order-workflow-page";

type OrderRow = {
  id: number | string;
  package?: string;
  created_date?: string;
  status?: string;
  createdby?: string;
  client_name?: string;
  subject_address?: string;
  reply?: string;
  remark?: string;
  remaining_tat?: string;
  assigner_name?: string;
  assigned_supervisor?: string;
  assigned_team_member?: string;
  uad_version?: string;
  non_uad?: string;
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
    message?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

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

const getTatBadgeClassName = (value?: string) => {
  const normalized = `${value ?? ""}`.trim();

  if (normalized === "04") {
    return "bg-red-100 text-red-700 dark:bg-red-dark/30 dark:text-red-300";
  }

  if (normalized === "06") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-300";
  }

  if (normalized === "12") {
    return "bg-green-100 text-green-700 dark:bg-green-dark/30 dark:text-green-300";
  }

  return "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white";
};

const getStatusBadgeClassName = (value?: string) => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();

  if (["accept", "accepted", "work in progress", "reopen"].includes(normalized)) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-300";
  }

  if (["reject", "cancel", "cancelled"].includes(normalized)) {
    return "bg-red-100 text-red-700 dark:bg-red-dark/30 dark:text-red-300";
  }

  if (["completed", "success"].includes(normalized)) {
    return "bg-green-100 text-green-700 dark:bg-green-dark/30 dark:text-green-300";
  }

  return "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white";
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

function LegacyAcceptedOrdersPage() {
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
        params: {
          status: "Accept",
          pageSize: "500",
        },
      });

      const payload = response.data;
      const rawRows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setOrders(rawRows);
      setCurrentPage(1);
    } catch (error) {
      setOrders([]);
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load accepted orders."),
      });
    } finally {
      setLoading(false);
    }
  }, [currentAssigneeKeys, isSupervisorUser]);

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

  const handleAssignOrder = async () => {
    if (!assignOrder) return;

    if (!selectedSupervisorId) {
      setMessage({
        type: "error",
        text: isSupervisorUser ? "Please select team member first." : "Please select supervisor first.",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (isSupervisorUser) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-team-member`, {
          assigned_team_member: selectedSupervisorId,
          assigner_name: selectedSupervisorLabel,
        });
      } else {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-supervisor`, {
          assigned_supervisor: selectedSupervisorId,
          assigner_name: selectedSupervisorLabel,
        });
      }

      setAssignOrder(null);
      setSelectedSupervisorId("");
      setMessage({
        type: "success",
        text: "Order has been successfully assigned",
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

  const handleRejectOrder = async () => {
    if (!cancelOrder) return;

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${cancelOrder.id}/status`, {
        status: "Reject",
        remark: cancelRemark.trim() || undefined,
      });

      setCancelOrder(null);
      setCancelRemark("");
      setMessage({
        type: "success",
        text: "Order has been successfully rejected",
      });
      await loadOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to reject the order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [orders, currentPage]);

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Overview</p>
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            Orders <span className="text-base font-normal text-dark-5">Orders summary, order assigning to Backbone Data Solutions employees</span>
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-stroke bg-gray-1/70 px-4 py-3 dark:border-dark-3 dark:bg-dark-2">
            <div className="text-xs uppercase tracking-wide text-dark-5">Accepted queue</div>
            <div className="mt-1 text-2xl font-semibold text-dark dark:text-white">{orders.length}</div>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.type === "error"
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4"
            : "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <Link
          href="/reports/order-reports"
          className="flex items-center justify-between rounded-xl border border-stroke bg-gray-1/60 px-4 py-3 text-sm font-medium text-dark transition hover:shadow-1 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          <span>Open all orders details</span>
          <span className="text-primary">→</span>
        </Link>
        <Link
          href="/orders/new-order"
          className="flex items-center justify-between rounded-xl border border-stroke bg-gray-1/60 px-4 py-3 text-sm font-medium text-dark transition hover:shadow-1 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          <span>Reassign new orders</span>
          <span className="text-primary">→</span>
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="overflow-auto rounded-xl border border-stroke dark:border-dark-3 max-h-[calc(100vh-320px)] cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <Table className="min-w-[1600px]">
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:font-semibold [&>th]:text-dark [&>th]:dark:text-white sticky top-0 z-10">
              <TableHead>Sr. No.</TableHead>
              <TableHead>File#</TableHead>
              <TableHead>UAD Version</TableHead>
              <TableHead>TAT</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Client Email</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Remaining TAT</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>Working Docs</TableHead>
              <TableHead>Assign</TableHead>
              <TableHead>Cancel</TableHead>
              <TableHead>Work Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={15} className="py-8 text-center text-dark-5">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="py-8 text-center text-dark-5">
                  No New Orders Found.... !
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order, index) => {
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
                  <TableRow
                    key={order.id}
                    className={`border-[#eee] align-top dark:border-dark-3 ${rowClassName}`}
                  >
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/orders/details/${order.id}`}
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{order.uad_version || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTatBadgeClassName(order.package)}`}>
                        {order.package || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">
                      {order.subject_address || "-"}
                    </TableCell>
                    <TableCell>{formatDateTime(order.created_date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClassName(order.status)}`}>
                        {order.status || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{order.createdby || "-"}</TableCell>
                    <TableCell>{order.client_name || "-"}</TableCell>
                    <TableCell>
                      <span className={`${`${order.remaining_tat ?? ""}`.startsWith("-") ? "font-medium text-red-600 dark:text-red-400" : "text-dark dark:text-white"}`}>
                        {order.remaining_tat || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.assigner_name || order.assigned_supervisor || order.assigned_team_member || "-"}
                    </TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">
                      {order.subject_address || "-"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
                        onClick={() => void openDetailModal(order.id, "downloads")}
                      >
                        View Docs
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded-md bg-green px-2.5 py-1 text-[11px] font-medium text-white hover:bg-green/90"
                        onClick={() => {
                          setAssignOrder(order);
                          setSelectedSupervisorId("");
                        }}
                      >
                        Assign
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded-md bg-red px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red/90"
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
                        className="rounded-md border border-stroke px-2.5 py-1 text-[11px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                        onClick={() => void openDetailModal(order.id, "instructions")}
                      >
                        View Status
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={orders.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        label="orders"
      />

      <ModalShell
        title={`Assign Order${assignOrder?.id ? ` - File #${assignOrder.id}` : ""}`}
        open={Boolean(assignOrder)}
        onClose={() => setAssignOrder(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Select Team Member
            </label>
            <p className="mb-2 text-xs text-dark-5">
              Assign this accepted file to a team member from your current supervisor queue.
            </p>
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
              className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Assigning..." : "Assign Order"}
            </button>
            <button
              type="button"
              onClick={() => setAssignOrder(null)}
              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium dark:border-dark-3"
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
              onClick={() => void handleRejectOrder()}
              disabled={submitting}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Cancelling..." : "Cancel Order"}
            </button>
            <button
              type="button"
              onClick={() => setCancelOrder(null)}
              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium dark:border-dark-3"
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
            {details?.order?.message && (
              <div className="mt-4 rounded bg-gray-1 p-4 text-sm dark:bg-dark-2">
                <div className="mb-2 font-semibold text-dark dark:text-white">Client Message</div>
                <div className="whitespace-pre-wrap text-dark-5">{details.order.message}</div>
              </div>
            )}
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
    return <OrderWorkflowPage mode="accepted" />;
  }

  return <LegacyAcceptedOrdersPage />;
}

