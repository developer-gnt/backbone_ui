"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { getAttachmentUrl as getAttachmentHref } from "@/lib/attachmentUrl";
import TablePagination from "@/components/ui/table-pagination";
import { standardFormat } from "@/lib/format-number";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrderRow = {
  id: number | string;
  package?: string;
  tat?: string;
  created_date?: string;
  status?: string;
  createdby?: string;
  client_name?: string;
  subject_address?: string;
  assigner_name?: string;
  remaining_tat?: string;
  feedback_rating?: number | string;
  feedback?: string;
  assigned_supervisor?: string;
  assigned_team_member?: string;
  reply?: string;
  remark?: string;
  emp_remark?: string;
  modify_date?: string;
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
    createdby?: string;
    client_name?: string;
    status?: string;
    subject_address?: string;
    supervisor_name?: string;
    team_member_name?: string;
    standard_instruction?: string;
    description?: string;
    reply?: string;
    remark?: string;
    emp_remark?: string;
    message?: string;
    modify_date?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

type TeamMemberOption = {
  id: number | string;
  firstname?: string;
  lastname?: string;
  username?: string;
  emp_supervisor?: string;
};

type TabValue = "Accept" | "Work In Progress" | "Completed" | "Cancelled";

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "Accepted", value: "Accept" },
  { label: "Work In Progress", value: "Work In Progress" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const ITEMS_PER_PAGE = 10;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatTat = (value?: string) => {
  if (!value) return "-";
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `${Number(trimmed)} Hours` : trimmed;
};

const getTatTextClassName = (value?: string) => {
  const normalized = `${value ?? ""}`.trim();

  if (normalized === "04") return "font-semibold text-red-600 dark:text-red-400";
  if (normalized === "06") return "font-semibold text-blue-600 dark:text-blue-400";
  if (normalized === "12") return "font-semibold text-green-600 dark:text-green-400";

  return "";
};

const getStatusBadgeClassName = (value?: string) => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();

  if (["completed", "success"].includes(normalized)) {
    return "bg-green-100 text-green-700 dark:bg-green-dark/30 dark:text-green-300";
  }

  if (["accept", "accepted", "work in progress", "reopen"].includes(normalized)) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-300";
  }

  if (["cancel", "cancelled"].includes(normalized)) {
    return "bg-red-100 text-red-700 dark:bg-red-dark/30 dark:text-red-300";
  }

  return "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white";
};

const exportRows = (rows: OrderRow[], filename: string) => {
  if (!rows.length) {
    window.alert("No assigned orders available to export.");
    return;
  }

  const headers = [
    "Sr. No.",
    "File#",
    "TAT",
    "Order Date",
    "Status",
    "User Name",
    "Client Name",
    "Assigned Team Member",
    "Remaining TAT",
    "Property Address",
    "Rating",
    "Feedback",
  ];

  const csvRows = rows.map((row, index) => [
    index + 1,
    row.id,
    formatTat(row.package || row.tat),
    formatDateTime(row.created_date),
    row.status || "",
    row.createdby || "",
    row.client_name || "",
    row.assigner_name || row.assigned_team_member || "",
    row.remaining_tat || "",
    row.subject_address || "",
    row.feedback_rating ?? "",
    row.feedback || "",
  ]);

  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
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

const getPersonLabel = (row?: TeamMemberOption) => {
  if (!row) return "";
  return `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim() || row.username || String(row.id);
};

export default function AssignedOrdersPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();
  const isSupervisor = role === "supervisor";
  const isTeamMember = role === "team member";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("Accept");
  const [currentPage, setCurrentPage] = useState(1);

  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [assignOrder, setAssignOrder] = useState<OrderRow | null>(null);
  const [assignTeamMemberId, setAssignTeamMemberId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [workOrder, setWorkOrder] = useState<OrderRow | null>(null);
  const [workMessage, setWorkMessage] = useState("");
  const [completeOrder, setCompleteOrder] = useState<OrderRow | null>(null);
  const [completeRemark, setCompleteRemark] = useState("");
  const [completeEmailChoice, setCompleteEmailChoice] = useState("Yes");
  const [completeExtraEmails, setCompleteExtraEmails] = useState("");
  const [completeSummaryNotes, setCompleteSummaryNotes] = useState("");
  const [completeFiles, setCompleteFiles] = useState<File[]>([]);
  const [resendOrder, setResendOrder] = useState<OrderRow | null>(null);
  const [resendRemark, setResendRemark] = useState("");
  const [resendExtraEmails, setResendExtraEmails] = useState("");
  const [resendFiles, setResendFiles] = useState<File[]>([]);
  const [cancelOrder, setCancelOrder] = useState<OrderRow | null>(null);
  const [cancelRemark, setCancelRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"overview" | "docs" | "instructions">("overview");
  const [details, setDetails] = useState<OrderDetailResponse | null>(null);

  const currentKeys = useMemo(
    () =>
      [user?.username, user?.email, `${user?.id ?? ""}`]
        .map((value) => `${value ?? ""}`.trim().toLowerCase())
        .filter(Boolean),
    [user?.email, user?.id, user?.username],
  );

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      try {
        const response = await axiosInstance.get("/masters/reports/orders", {
          params: {
            status: "Accept,Work In Progress,Completed",
            assignedSupervisor: isSupervisor ? currentKeys.join(",") : undefined,
            assignedTeamMember: isTeamMember ? currentKeys.join(",") : undefined,
            pageSize: "500",
          },
        });

        const payload = response.data;
        const nextRows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        setOrders(nextRows);
        setMessage(null);
      } catch (error) {
        setOrders([]);
        setMessage(getApiErrorMessage(error, "Unable to load assigned orders."));
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [currentKeys, isSupervisor, isTeamMember]);

  useEffect(() => {
    if (!isSupervisor) {
      setTeamMembers([]);
      return;
    }

    const loadTeamMembers = async () => {
      try {
        const response = await axiosInstance.get("/user/employees", {
          params: { role: "Team Member" },
        });

        const next = (Array.isArray(response.data) ? response.data : []).filter(
          (item: TeamMemberOption) => currentKeys.includes(`${item.emp_supervisor ?? ""}`.trim().toLowerCase()),
        );

        setTeamMembers(next);
      } catch {
        setTeamMembers([]);
      }
    };

    void loadTeamMembers();
  }, [currentKeys, isSupervisor]);

  const visibleTabs = useMemo(
    () =>
      isTeamMember
        ? TABS.filter((tab) => tab.value === "Accept" || tab.value === "Completed")
        : isSupervisor
          ? TABS.filter((tab) => tab.value !== "Work In Progress" && tab.value !== "Cancelled")
          : TABS,
    [isSupervisor, isTeamMember],
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders
      .filter((row) => {
        if (activeTab === "Cancelled") {
          return (row.status || "") === "Cancel" || (row.status || "") === "Reopen";
        }
        return (row.status || "") === activeTab;
      })
      .filter((row) => {
        if (!keyword) return true;

        return [
          row.id,
          row.createdby,
          row.client_name,
          row.subject_address,
          row.status,
          row.assigner_name,
          row.reply,
          row.remark,
          row.emp_remark,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      });
  }, [activeTab, orders, search]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(visibleTabs[0]?.value ?? "Accept");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, orders]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const showWorkingColumns = activeTab !== "Completed" && activeTab !== "Cancelled";
  const showCompletedColumns = activeTab === "Completed";
  const showActionColumn = (isSupervisor && activeTab === "Accept") || (isTeamMember && activeTab === "Accept");
  const showResendColumn = activeTab === "Completed" && (isSupervisor || isTeamMember);
  const tableColSpan = [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    showWorkingColumns ? 1 : 0,
    showWorkingColumns ? 1 : 0,
    showWorkingColumns ? 1 : 0,
    showActionColumn ? 1 : 0,
    showCompletedColumns ? 1 : 0,
    showResendColumn ? 1 : 0,
    showCompletedColumns ? 1 : 0,
    1,
    showCompletedColumns ? 1 : 0,
    1,
  ].reduce((sum, value) => sum + value, 0);

  const openDetails = async (orderId: number | string, tab: "overview" | "docs" | "instructions") => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsTab(tab);
    setDetails(null);

    try {
      const response = await axiosInstance.get(`/masters/reports/orders/${orderId}/details`);
      setDetails(response.data);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to load order details."));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAssignTeamMember = async () => {
    if (!assignOrder || !assignTeamMemberId) {
      setMessage("Please select a team member first.");
      return;
    }

    const selected = teamMembers.find((item) => String(item.id) === String(assignTeamMemberId));

    setSubmitting(true);
    try {
      if (assignNote.trim()) {
        await axiosInstance.patch(`/masters/orders/${assignOrder.id}/reply`, {
          reply: assignNote.trim(),
        });
      }

      await axiosInstance.patch(`/masters/orders/${assignOrder.id}/assign-team-member`, {
        assigned_team_member: String(assignTeamMemberId),
        assigner_name: getPersonLabel(selected),
        status: "Work In Progress",
      });

      setOrders((prev) =>
        prev.map((row) =>
          String(row.id) === String(assignOrder.id)
            ? {
              ...row,
              assigned_team_member: String(assignTeamMemberId),
              assigner_name: getPersonLabel(selected),
              status: "Work In Progress",
              reply: assignNote.trim() || row.reply,
            }
            : row,
        ),
      );

      setAssignOrder(null);
      setAssignTeamMemberId("");
      setAssignNote("");
      setMessage(`Order #${assignOrder.id} has been moved to Work In Progress.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to assign the selected team member."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWork = async () => {
    if (!workOrder) {
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${workOrder.id}/start-work`, {
        message: workMessage.trim(),
      });

      setOrders((prev) =>
        prev.map((row) =>
          String(row.id) === String(workOrder.id)
            ? {
              ...row,
              status: "Work In Progress",
              reply: workMessage.trim() || row.reply,
            }
            : row,
        ),
      );

      setWorkOrder(null);
      setWorkMessage("");
      setMessage(`Order #${workOrder.id} moved to Work In Progress.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to update the work status."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;
    if (!cancelRemark.trim()) {
      setMessage("Please enter a remark for cancellation.");
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${cancelOrder.id}/status`, {
        status: "Cancel",
        remark: cancelRemark.trim(),
      });
      setOrders((prev) =>
        prev.map((row) =>
          String(row.id) === String(cancelOrder.id)
            ? { ...row, status: "Cancel", remark: cancelRemark.trim() }
            : row,
        ),
      );
      setCancelOrder(null);
      setCancelRemark("");
      setMessage(`Order #${cancelOrder.id} has been cancelled successfully.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to cancel the order."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenOrder = async (order: OrderRow) => {
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${order.id}/status`, {
        status: "Reopen",
      });
      setOrders((prev) =>
        prev.map((row) =>
          String(row.id) === String(order.id) ? { ...row, status: "Reopen" } : row,
        ),
      );
      setMessage(`Order #${order.id} has been reopened successfully.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to reopen the order."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmission = async (replaceExisting: boolean) => {
    const targetOrder = replaceExisting ? resendOrder : completeOrder;
    const remark = replaceExisting ? resendRemark : completeRemark;
    const emailChoice = replaceExisting ? "Yes" : completeEmailChoice;
    const extraEmails = replaceExisting ? resendExtraEmails : completeExtraEmails;
    const summaryNotes = replaceExisting ? "" : completeSummaryNotes;
    const files = replaceExisting ? resendFiles : completeFiles;

    if (!targetOrder) {
      return;
    }

    if (!files.length) {
      setMessage("Please upload at least one completed file.");
      return;
    }

    const formData = new FormData();
    formData.append("emp_remark", remark.trim());
    formData.append("complete_notification_email", emailChoice);
    formData.append("extra_emails", extraEmails.trim());
    formData.append("summary_notes", summaryNotes.trim());
    formData.append("replace_existing", String(replaceExisting));

    files.forEach((file) => {
      formData.append("completedAttachments", file);
    });

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/masters/orders/${targetOrder.id}/complete`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setOrders((prev) =>
        prev.map((row) =>
          String(row.id) === String(targetOrder.id)
            ? {
              ...row,
              status: "Completed",
              reply: remark.trim() || row.reply,
            }
            : row,
        ),
      );

      setCompleteOrder(null);
      setCompleteRemark("");
      setCompleteEmailChoice("Yes");
      setCompleteExtraEmails("");
      setCompleteSummaryNotes("");
      setCompleteFiles([]);
      setResendOrder(null);
      setResendRemark("");
      setResendExtraEmails("");
      setResendFiles([]);
      setMessage(
        replaceExisting
          ? `Completed files for order #${targetOrder.id} were resent successfully.`
          : `Order #${targetOrder.id} marked as completed successfully.`,
      );
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to submit the completed files."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Overview</p>
          <h2 className="text-xl font-semibold text-dark dark:text-white">Orders Assigned</h2>
          <p className="mt-1 text-sm text-dark-5">
            {isSupervisor
              ? "Orders assigned to this supervisor account, including accepted, in-progress, and completed work."
              : "Orders assigned to your team-member account."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportRows(filteredRows, `AssignedOrders_${activeTab.replace(/\s+/g, "_")}.csv`)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Get Data
          </button>
          <Link
            href="/reports/order-reports"
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
          >
            Open Order Report
          </Link>
        </div>
      </div>

      {isSupervisor && (
        <div className="mb-4 rounded-lg border border-stroke bg-gray-1/70 px-4 py-3 text-sm text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
          For more details of any order assigned to you,&nbsp;
          <Link href="/reports/order-reports" className="font-semibold text-primary underline">
            click here!!
          </Link>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2 border-b border-stroke pb-3 dark:border-dark-3">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${activeTab === tab.value
              ? "bg-primary text-white"
              : "bg-gray-1 text-dark hover:bg-gray-2 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by file #, client, address, status"
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white lg:max-w-xl"
        />

        <div className="rounded-lg bg-gray-1 px-4 py-3 text-sm dark:bg-dark-2">
          <div className="text-dark-5">Current Count</div>
          <div className="font-semibold text-dark dark:text-white">{filteredRows.length}</div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.toLowerCase().includes("unable") || message.toLowerCase().includes("please") ? "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4" : "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"}`}>
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-stroke dark:border-dark-3">
        <Table className={activeTab === "Completed" ? "min-w-[1650px]" : "min-w-[1500px]"}>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No.</TableHead>
              <TableHead>File#</TableHead>
              <TableHead>TAT</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Client Name</TableHead>
              {showWorkingColumns && <TableHead>Remaining TAT</TableHead>}
              <TableHead>Property Address</TableHead>
              <TableHead>Assigned Team Member</TableHead>
              {showWorkingColumns && <TableHead>Working Docs</TableHead>}
              {showWorkingColumns && <TableHead>Client Special Instructions</TableHead>}
              {showActionColumn && <TableHead>Actions</TableHead>}
              {showCompletedColumns && <TableHead>Completed Docs</TableHead>}
              {showResendColumn && <TableHead>Resend</TableHead>}
              {showCompletedColumns && <TableHead>Backbone Remark</TableHead>}
              <TableHead>Client Rating</TableHead>
              {showCompletedColumns && <TableHead>Completed Date</TableHead>}
              <TableHead>Client Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={tableColSpan} className="py-8 text-center text-dark-5">
                  Loading assigned orders...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length ? (
              paginatedRows.map((row, index) => (
                <TableRow key={String(row.id)}>
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell>
                    <Link href={`/orders/details/${row.id}`} className="font-medium text-primary underline underline-offset-2">
                      {row.id}
                    </Link>
                  </TableCell>
                  <TableCell className={getTatTextClassName(row.package || row.tat)}>
                    {formatTat(row.package || row.tat)}
                  </TableCell>
                  <TableCell>{formatDateTime(row.created_date)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClassName(row.status)}`}>
                      {row.status || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{row.createdby || "-"}</TableCell>
                  <TableCell>{row.client_name || "-"}</TableCell>
                  {showWorkingColumns && <TableCell>{row.remaining_tat || "-"}</TableCell>}
                  <TableCell className="max-w-[260px] whitespace-normal">{row.subject_address || "-"}</TableCell>
                  <TableCell>{row.assigner_name || row.assigned_team_member || "-"}</TableCell>
                  {showWorkingColumns && (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void openDetails(row.id, "docs")}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
                      >
                        View Docs
                      </button>
                    </TableCell>
                  )}
                  {showWorkingColumns && (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void openDetails(row.id, "instructions")}
                        className="rounded-md border border-stroke px-3 py-1 text-xs font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                      >
                        View
                      </button>
                    </TableCell>
                  )}
                  {showActionColumn && (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {isSupervisor &&
                          (activeTab === "Accept" || activeTab === "Work In Progress") && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignOrder(row);
                                setAssignTeamMemberId(String(row.assigned_team_member ?? ""));
                                setAssignNote(row.reply || "");
                              }}
                              className="rounded-md bg-green px-3 py-1 text-xs font-medium text-white hover:bg-green/90"
                            >
                              {activeTab === "Accept"
                                ? "Assign Team Member"
                                : "Reassign Team Member"}
                            </button>
                          )}

                        {isTeamMember && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompleteOrder(row);
                              setCompleteRemark(row.reply || "");
                              setCompleteEmailChoice("Yes");
                              setCompleteExtraEmails("");
                              setCompleteSummaryNotes("");
                              setCompleteFiles([]);
                            }}
                            className="rounded-md bg-green px-2.5 py-1 text-[11px] font-medium text-white hover:bg-green/90"
                          >
                            Complete Report
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {showCompletedColumns && (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void openDetails(row.id, "docs")}
                        className="rounded-md border border-stroke px-3 py-1 text-xs font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                      >
                        View Completed Docs
                      </button>
                    </TableCell>
                  )}
                  {showResendColumn && (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          setResendOrder(row);
                          setResendRemark(row.emp_remark || row.reply || "");
                          setResendExtraEmails("");
                          setResendFiles([]);
                        }}
                        className="rounded-md bg-yellow-dark px-3 py-1 text-xs font-medium text-white hover:bg-yellow-dark/90"
                      >
                        Resend
                      </button>
                    </TableCell>
                  )}
                  {showCompletedColumns && (
                    <TableCell className="max-w-[240px] whitespace-normal">
                      {row.emp_remark || row.remark || row.reply || "-"}
                    </TableCell>
                  )}
                  <TableCell>{row.feedback_rating ?? "-"}</TableCell>
                  {showCompletedColumns && <TableCell>{formatDateTime(row.modify_date)}</TableCell>}
                  <TableCell className="max-w-[220px] whitespace-normal">{row.feedback || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColSpan} className="py-8 text-center text-dark-5">
                  No Data Found !
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
        label="assigned orders"
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
              Docs
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
            <p className="text-sm text-dark-5">Loading details...</p>
          ) : !details ? (
            <p className="text-sm text-dark-5">No detail data found.</p>
          ) : detailsTab === "docs" ? (
            <div className="space-y-5">
              <div>
                <h4 className="mb-2 font-semibold text-dark dark:text-white">Working Docs</h4>
                {details.downloads.length ? (
                  <div className="space-y-2">
                    {details.downloads.map((item) => (
                      <div key={`download-${item.id}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="font-medium text-dark dark:text-white">{item.type || "Document"}</div>
                        <div className="text-sm text-dark-5">{item.filename || "Unnamed file"}</div>
                        {getAttachmentHref(item.filepath) && (
                          <a
                            href={getAttachmentHref(item.filepath) ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-sm font-medium text-primary underline"
                          >
                            Open File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-5">No working docs found.</p>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-dark dark:text-white">Completed Docs</h4>
                {details.completedDownloads.length ? (
                  <div className="space-y-2">
                    {details.completedDownloads.map((item) => (
                      <div key={`complete-${item.id}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="font-medium text-dark dark:text-white">{item.type || "Completed Document"}</div>
                        <div className="text-sm text-dark-5">{item.filename || "Unnamed file"}</div>
                        {getAttachmentHref(item.filepath) && (
                          <a
                            href={getAttachmentHref(item.filepath) ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-sm font-medium text-primary underline"
                          >
                            Open File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-5">No completed docs found.</p>
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
                <div className="whitespace-pre-wrap text-dark-5">{details.order.standard_instruction || "No standard instruction available."}</div>
              </div>
              <div className="rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2">
                <div className="mb-2 font-semibold text-dark dark:text-white">Work Status / Remark</div>
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
                <div className="text-sm text-dark-5">Assigned Team Member</div>
                <div className="font-medium text-dark dark:text-white">{details.order.team_member_name || details.order.supervisor_name || "-"}</div>
              </div>
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3 sm:col-span-2">
                <div className="text-sm text-dark-5">Property Address</div>
                <div className="font-medium text-dark dark:text-white">{details.order.subject_address || "-"}</div>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {assignOrder && isSupervisor && (
        <ModalShell title={`${assignOrder.assigned_team_member
          ? "Reassign Team Member"
          : "Assign Team Member"
          } - File #${assignOrder.id}`} onClose={() => setAssignOrder(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Select Team Member</label>
              <select
                value={assignTeamMemberId}
                onChange={(event) => setAssignTeamMemberId(event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="">Select Team Member</option>
                {teamMembers.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {getPersonLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Message / Work Status</label>
              <textarea
                value={assignNote}
                onChange={(event) => setAssignNote(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Add optional notes before moving this order into work in progress"
              />
            </div>

            <div className="rounded-lg bg-gray-1 px-4 py-3 text-sm dark:bg-dark-2">
              This action updates the file to <span className="font-semibold text-dark dark:text-white">Work In Progress</span>.
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
                onClick={() => void handleAssignTeamMember()}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : "Start Work"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {workOrder && isTeamMember && (
        <ModalShell title={`Work Status - File #${workOrder.id}`} onClose={() => setWorkOrder(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Message / Remark</label>
              <textarea
                value={workMessage}
                onChange={(event) => setWorkMessage(event.target.value)}
                rows={6}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Update the work status or remark for this file"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setWorkOrder(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleStartWork()}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : workOrder.status === "Work In Progress" ? "Update Status" : "Start Work"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {completeOrder && isTeamMember && (
        <ModalShell title={`Complete Report - File #${completeOrder.id}`} onClose={() => setCompleteOrder(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Employee Remark</label>
              <textarea
                value={completeRemark}
                onChange={(event) => setCompleteRemark(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Enter report completion remarks"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Send Completion Email</label>
                <select
                  value={completeEmailChoice}
                  onChange={(event) => setCompleteEmailChoice(event.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Extra Emails</label>
                <input
                  value={completeExtraEmails}
                  onChange={(event) => setCompleteExtraEmails(event.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  placeholder="Optional comma-separated emails"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Summary Notes</label>
              <textarea
                value={completeSummaryNotes}
                onChange={(event) => setCompleteSummaryNotes(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Optional summary for the completed report"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Upload Completed Files</label>
              <input
                type="file"
                multiple
                onChange={(event) => setCompleteFiles(Array.from(event.target.files ?? []))}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompleteOrder(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCompleteSubmission(false)}
                disabled={submitting}
                className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-white hover:bg-green/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : "Complete Report"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {resendOrder && (isTeamMember || isSupervisor) && (
        <ModalShell title={`Resend Completed Files - File #${resendOrder.id}`} onClose={() => setResendOrder(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Remark</label>
              <textarea
                value={resendRemark}
                onChange={(event) => setResendRemark(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Update the resend remark"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Extra Emails</label>
              <input
                value={resendExtraEmails}
                onChange={(event) => setResendExtraEmails(event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Optional comma-separated emails"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Upload New Files</label>
              <input
                type="file"
                multiple
                onChange={(event) => setResendFiles(Array.from(event.target.files ?? []))}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setResendOrder(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCompleteSubmission(true)}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting ? "Saving..." : "Resend"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {cancelOrder && isTeamMember && (
        <ModalShell
          title={`Cancel Order - File #${cancelOrder.id}`}
          onClose={() => { setCancelOrder(null); setCancelRemark(""); }}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Enter Remark For Cancellation <span className="text-red">*</span>
              </label>
              <textarea
                value={cancelRemark}
                onChange={(event) => setCancelRemark(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder="Please enter a reason for cancellation"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setCancelOrder(null); setCancelRemark(""); }}
                className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark dark:border-dark-3 dark:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={submitting}
                className="rounded-md bg-red px-3 py-1.5 text-xs font-medium text-white hover:bg-red/90 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
