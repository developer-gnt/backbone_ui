"use client";

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
import { compactFormat, standardFormat } from "@/lib/format-number";
import { getAttachmentUrl } from "@/lib/attachmentUrl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OverviewCard } from "./_components/overview-cards/card";
import * as icons from "./_components/overview-cards/icons";

type Metric = {
  value: number;
  growthRate: number;
};

type ClientDashboardOrder = {
  id: number | string;
  package?: string;
  tat?: string;
  status?: string;
  modify_date?: string;
  amount?: number;
  subject_address?: string;
  created_date?: string;
  assigned_supervisor?: string;
  assigned_team_member?: string;
  feedback_rating?: number | string | null;
  feedback?: string;
  emp_remark?: string;
  remark?: string;
  reply?: string;
};

type ClientDashboardTransaction = {
  id: number | string;
  amount?: number;
  transaction_type?: string;
  created_date?: string;
  order_id?: string | number;
};

type AdminDashboardOrder = {
  id: number | string;
  package?: string;
  tat?: string;
  amount?: number;
  created_date?: string;
  status?: string;
  createdby?: string;
  client_name?: string;
  email?: string;
  subject_address?: string;
  assigner_name?: string;
  modify_date?: string;
  feedback?: string;
  feedback_rating?: string | number | null;
  remaining_tat?: string;
  remark?: string;
};

type AdminDashboardTransaction = {
  id: number | string;
  amount?: number | string;
  createdby?: string;
  client_name?: string;
  email?: string;
  created_date?: string;
  status?: string;
  transaction_id?: string;
  transaction_type?: string;
};

type OrderSearchFilters = {
  clientName: string;
  fileNumber: string;
  subjectAddress: string;
};

type DashboardSummary = {
  overview: {
    clients: Metric;
    staff: Metric;
    orders: Metric;
    credits: Metric;
  };
  paymentsOverview: {
    received: { x: string; y: number }[];
    due: { x: string; y: number }[];
  };
  weeklyActivity: {
    sales: { x: string; y: number }[];
    revenue: { x: string; y: number }[];
  };
  orderStatusBreakdown: { name: string; amount: number }[];
  topClients: Array<{
    id: number;
    name: string;
    email?: string;
    status?: string;
    city?: string;
    wallet: number;
    orders: number;
  }>;
  recentOrders: Array<{
    id: number;
    clientName: string;
    package: string;
    status: string;
    amount: number;
    createdDate?: string;
  }>;
  recentTransactions: Array<{
    id: number;
    clientName: string;
    type: string;
    status: string;
    amount: number;
    createdDate?: string;
  }>;
  quickStats: {
    websiteAccessTotal: number;
    websiteAccessToday: number;
    attendanceToday: number;
    pendingOrders: number;
    completedOrders: number;
  };
};

const emptySummary: DashboardSummary = {
  overview: {
    clients: { value: 0, growthRate: 0 },
    staff: { value: 0, growthRate: 0 },
    orders: { value: 0, growthRate: 0 },
    credits: { value: 0, growthRate: 0 },
  },
  paymentsOverview: {
    received: [],
    due: [],
  },
  weeklyActivity: {
    sales: [],
    revenue: [],
  },
  orderStatusBreakdown: [{ name: "No Orders", amount: 1 }],
  topClients: [],
  recentOrders: [],
  recentTransactions: [],
  quickStats: {
    websiteAccessTotal: 0,
    websiteAccessToday: 0,
    attendanceToday: 0,
    pendingOrders: 0,
    completedOrders: 0,
  },
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

const formatCurrency = (value?: number | string) => {
  return `$${standardFormat(Number(value ?? 0))}`;
};

const getTatRowClassName = (value?: string) => {
  const normalized = `${value ?? ""}`.trim();

  if (normalized === "04") {
    return "font-semibold text-red-600 dark:text-red-400";
  }

  if (normalized === "06") {
    return "font-semibold text-blue-600 dark:text-blue-400";
  }

  if (normalized === "12") {
    return "font-semibold text-green-600 dark:text-green-400";
  }

  return "";
};

const getStatusBadgeClassName = (status?: string) => {
  const normalized = `${status ?? ""}`.trim().toLowerCase();

  if (["completed", "approved", "success"].includes(normalized)) {
    return "bg-green-100 text-green-700 dark:bg-green-dark/30 dark:text-green-300";
  }

  if (["cancel", "cancelled"].includes(normalized)) {
    return "bg-red-100 text-red-700 dark:bg-red-dark/30 dark:text-red-300";
  }

  if (["work in progress", "accept", "accepted", "reopen"].includes(normalized)) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-dark/30 dark:text-blue-300";
  }

  return "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white";
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  return `"${`${value ?? ""}`.replace(/"/g, '""')}"`;
};

const getSupervisorStatusOptions = (status?: string) => {
  const currentStatus = `${status ?? "New Order"}`.trim() || "New Order";
  const normalizedStatus = currentStatus.toLowerCase();

  if (normalizedStatus === "completed") {
    return { options: [currentStatus], disabled: true };
  }

  if (normalizedStatus === "cancel") {
    return { options: [currentStatus, "Reopen"], disabled: false };
  }

  if (normalizedStatus === "reopen") {
    return { options: [currentStatus, "Cancel"], disabled: false };
  }

  return { options: [currentStatus, "Cancel"], disabled: false };
};

export default function Home() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();
  const isClientUser = role === "client";
  const isSupervisorUser = role === "supervisor";
  const isTeamMemberUser = role === "team member";
  const isMemberUser = isSupervisorUser || isTeamMemberUser;
  const isAdminUser = !isClientUser && !isMemberUser;
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [clientOrders, setClientOrders] = useState<ClientDashboardOrder[]>([]);
  const [clientTransactions, setClientTransactions] = useState<ClientDashboardTransaction[]>([]);
  const [memberOrders, setMemberOrders] = useState<ClientDashboardOrder[]>([]);
  const [supervisorOrders, setSupervisorOrders] = useState<AdminDashboardOrder[]>([]);
  const [adminOrders, setAdminOrders] = useState<AdminDashboardOrder[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<AdminDashboardTransaction[]>([]);
  const [memberTeamCount, setMemberTeamCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [supervisorPendingFilters, setSupervisorPendingFilters] = useState<OrderSearchFilters>({
    clientName: "",
    fileNumber: "",
    subjectAddress: "",
  });
  const [supervisorFilters, setSupervisorFilters] = useState<OrderSearchFilters>({
    clientName: "",
    fileNumber: "",
    subjectAddress: "",
  });
  const [pendingOrderFilters, setPendingOrderFilters] = useState<OrderSearchFilters>({
    clientName: "",
    fileNumber: "",
    subjectAddress: "",
  });
  const [orderFilters, setOrderFilters] = useState<OrderSearchFilters>({
    clientName: "",
    fileNumber: "",
    subjectAddress: "",
  });
  const [supervisorPageSize, setSupervisorPageSize] = useState("25");
  const [orderPageSize, setOrderPageSize] = useState("25");
  const [transactionPageSize, setTransactionPageSize] = useState("5");
  const [supervisorCurrentPage, setSupervisorCurrentPage] = useState(1);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSupervisorOrders, setIsLoadingSupervisorOrders] = useState(false);
  const [isLoadingAdminOrders, setIsLoadingAdminOrders] = useState(false);
  const [isLoadingAdminTransactions, setIsLoadingAdminTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supervisorFeedback, setSupervisorFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [supervisorOrdersError, setSupervisorOrdersError] = useState<string | null>(null);
  const [adminOrdersError, setAdminOrdersError] = useState<string | null>(null);
  const [adminTransactionsError, setAdminTransactionsError] = useState<string | null>(null);
  const [isUpdatingSupervisorStatus, setIsUpdatingSupervisorStatus] = useState<string | null>(null);
  const [clientPageSize, setClientPageSize] = useState(20);
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [clientPendingFileFilter, setClientPendingFileFilter] = useState("");
  const [clientPendingAddressFilter, setClientPendingAddressFilter] = useState("");
  const [clientFileFilter, setClientFileFilter] = useState("");
  const [clientAddressFilter, setClientAddressFilter] = useState("");
  const [clientFeedback, setClientFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [clientUpdatingStatus, setClientUpdatingStatus] = useState<string | null>(null);
  const [clientCancelModal, setClientCancelModal] = useState<{
    id: string | number;
  } | null>(null);
  const [clientCancelRemark, setClientCancelRemark] = useState("");
  const [clientDownloadsModal, setClientDownloadsModal] = useState<{
    orderId: string | number;
    items: { id: string | number; type?: string; filename?: string; filepath?: string }[];
    loading: boolean;
  } | null>(null);
  const [clientCommentsModal, setClientCommentsModal] = useState<{
    orderId: string | number;
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isClientUser) {
          const username = user?.username || user?.email || undefined;
          const [ordersResponse, transactionsResponse] = await Promise.all([
            axiosInstance.get("/masters/reports/orders", {
              params: { createdby: username, pageSize: 100 },
            }),
            axiosInstance.get("/masters/reports/transactions", {
              params: { username, type: "all" },
            }),
          ]);

          const nextOrders = Array.isArray(ordersResponse.data?.data)
            ? ordersResponse.data.data
            : Array.isArray(ordersResponse.data)
              ? ordersResponse.data
              : [];

          const nextTransactions = Array.isArray(transactionsResponse.data)
            ? transactionsResponse.data
            : [];

          setClientOrders(nextOrders);
          setClientTransactions(nextTransactions);
          setMemberOrders([]);
          setMemberTeamCount(0);
          setSummary(emptySummary);
          return;
        }

        if (isMemberUser) {
          const identifiers = [user?.username, user?.email, `${user?.id ?? ""}`]
            .map((value) => `${value ?? ""}`.trim())
            .filter(Boolean)
            .join(",");

          const requests: Promise<any>[] = [
            axiosInstance.get("/masters/reports/orders", {
              params: {
                status: isSupervisorUser
                  ? "Accept,Work In Progress,Completed"
                  : "Accept,Work In Progress,Completed",
                assignedSupervisor: isSupervisorUser ? identifiers : undefined,
                assignedTeamMember: isTeamMemberUser ? identifiers : undefined,
                pageSize: 100,
              },
            }),
          ];

          if (isSupervisorUser) {
            requests.push(
              axiosInstance.get("/user/employees", {
                params: { role: "Team Member" },
              }),
            );
          }

          const [ordersResponse, teamResponse] = await Promise.all(requests);

          const nextOrders = Array.isArray(ordersResponse.data?.data)
            ? ordersResponse.data.data
            : Array.isArray(ordersResponse.data)
              ? ordersResponse.data
              : [];

          const nextTeamCount = isSupervisorUser
            ? (Array.isArray((teamResponse as any)?.data) ? (teamResponse as any).data : []).filter(
                (item: { emp_supervisor?: string }) =>
                  identifiers
                    .toLowerCase()
                    .split(",")
                    .includes(`${item.emp_supervisor ?? ""}`.trim().toLowerCase()),
              ).length
            : 0;

          setMemberOrders(nextOrders);
          setMemberTeamCount(nextTeamCount);
          setClientOrders([]);
          setClientTransactions([]);
          setSummary(emptySummary);
          return;
        }

        const response = await axiosInstance.get("/masters/reports/dashboard-summary");
        setSummary(response.data ?? emptySummary);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load dashboard data."));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [
    isClientUser,
    isMemberUser,
    isSupervisorUser,
    isTeamMemberUser,
    user?.email,
    user?.id,
    user?.username,
  ]);

  const fetchSupervisorOrders = useCallback(async () => {
    if (!isSupervisorUser) {
      return;
    }

    setIsLoadingSupervisorOrders(true);
    setSupervisorOrdersError(null);

    try {
      const response = await axiosInstance.get("/masters/reports/orders", {
        params: {
          id: supervisorFilters.fileNumber || undefined,
          subaddress: supervisorFilters.subjectAddress || undefined,
          pageSize: 300,
        },
      });

      setSupervisorOrders(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      setSupervisorOrders([]);
      setSupervisorOrdersError(
        getApiErrorMessage(err, "Unable to load supervisor dashboard orders."),
      );
    } finally {
      setIsLoadingSupervisorOrders(false);
    }
  }, [
    isSupervisorUser,
    supervisorFilters.fileNumber,
    supervisorFilters.subjectAddress,
    supervisorPageSize,
  ]);

  useEffect(() => {
    if (!isSupervisorUser) {
      setSupervisorOrders([]);
      setSupervisorOrdersError(null);
      return;
    }

    void fetchSupervisorOrders();
  }, [fetchSupervisorOrders, isSupervisorUser]);

  useEffect(() => {
    if (!isAdminUser) {
      setAdminOrders([]);
      setAdminOrdersError(null);
      return;
    }

    const loadAdminOrders = async () => {
      setIsLoadingAdminOrders(true);
      setAdminOrdersError(null);

      try {
        const response = await axiosInstance.get("/masters/reports/orders", {
          params: {
            name: orderFilters.clientName || undefined,
            id: orderFilters.fileNumber || undefined,
            subaddress: orderFilters.subjectAddress || undefined,
            pageSize: 300,
          },
        });

        setAdminOrders(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (err) {
        setAdminOrders([]);
        setAdminOrdersError(getApiErrorMessage(err, "Unable to load dashboard orders."));
      } finally {
        setIsLoadingAdminOrders(false);
      }
    };

    void loadAdminOrders();
  }, [isAdminUser, orderFilters.clientName, orderFilters.fileNumber, orderFilters.subjectAddress]);

  useEffect(() => {
    if (!isAdminUser) {
      setAdminTransactions([]);
      setEmployeeCount(0);
      setAdminTransactionsError(null);
      return;
    }

    const loadAdminTransactions = async () => {
      setIsLoadingAdminTransactions(true);
      setAdminTransactionsError(null);

      try {
        const [transactionsResponse, employeesResponse] = await Promise.all([
          axiosInstance.get("/masters/reports/transactions", {
            params: { type: "all" },
          }),
          axiosInstance.get("/user/employees"),
        ]);

        const transactions = Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data
          : [];
        const employees = Array.isArray(employeesResponse.data)
          ? employeesResponse.data
          : [];

        setAdminTransactions(transactions);
        setEmployeeCount(
          employees.filter(
            (item: { status?: string }) =>
              `${item?.status ?? ""}`.trim().toLowerCase() !== "deleted",
          ).length,
        );
      } catch (err) {
        setAdminTransactions([]);
        setEmployeeCount(0);
        setAdminTransactionsError(
          getApiErrorMessage(err, "Unable to load last transactions."),
        );
      } finally {
        setIsLoadingAdminTransactions(false);
      }
    };

    void loadAdminTransactions();
  }, [isAdminUser]);

  const handleDashboardSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderFilters({
      clientName: pendingOrderFilters.clientName.trim(),
      fileNumber: pendingOrderFilters.fileNumber.trim(),
      subjectAddress: pendingOrderFilters.subjectAddress.trim(),
    });
  };

  const handleDashboardExport = () => {
    if (!adminOrders.length) {
      window.alert("No data found for export.");
      return;
    }

    const headers = [
      "Sr. No.",
      "File#",
      "TAT",
      "Amount",
      "Order Date",
      "Status",
      "User Name",
      "Client Name",
      "Email",
      "Property Address",
      "Assigned",
      "Completed Date",
      "Client Feedback",
      "Client Rating",
      "Remaining TAT",
    ];

    const csvRows = adminOrders.map((order, index) =>
      [
        index + 1,
        order.id,
        order.package || order.tat || "",
        Number(order.amount ?? 0).toFixed(2),
        formatDateTime(order.created_date),
        order.status || "",
        order.createdby || "",
        order.client_name || "",
        order.email || "",
        order.subject_address || "",
        order.assigner_name || "",
        formatDateTime(order.modify_date),
        order.feedback || "",
        order.feedback_rating ?? "",
        order.remaining_tat || "",
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    const csvContent = [headers.map(escapeCsvValue).join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Dashboard_Orders.csv";
    link.click();

    window.URL.revokeObjectURL(url);
  };

  const handleSupervisorSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSupervisorFilters({
      clientName: "",
      fileNumber: supervisorPendingFilters.fileNumber.trim(),
      subjectAddress: supervisorPendingFilters.subjectAddress.trim(),
    });
  };

  const handleSupervisorExport = () => {
    if (!supervisorOrders.length) {
      window.alert("No Data Found !");
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
      "Property Address",
      "Client Rating",
      "Client Feedback",
      "Assigned",
      "Completed Date",
    ];

    const csvRows = supervisorOrders.map((order, index) =>
      [
        index + 1,
        order.id,
        order.package || order.tat || "",
        formatDateTime(order.created_date),
        order.status || "",
        order.createdby || "",
        order.client_name || "",
        order.subject_address || "",
        order.feedback_rating ?? "",
        order.feedback || "",
        order.assigner_name || "",
        formatDateTime(order.modify_date),
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    const csvContent = [headers.map(escapeCsvValue).join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "DashboardSupervisor_Orders.csv";
    link.click();

    window.URL.revokeObjectURL(url);
  };

  const handleSupervisorStatusChange = async (
    order: AdminDashboardOrder,
    nextStatus: string,
  ) => {
    const currentStatus = `${order.status ?? ""}`.trim();

    if (!nextStatus || nextStatus === currentStatus) {
      return;
    }

    let remark: string | undefined;

    if (nextStatus === "Reopen") {
      const confirmed = window.confirm("You want to Reopen this order.");

      if (!confirmed) {
        return;
      }
    }

    if (nextStatus === "Cancel") {
      const enteredRemark = window.prompt(
        "Enter Remark For Cancellation",
        `${order.remark ?? ""}`,
      );

      if (!enteredRemark?.trim()) {
        return;
      }

      remark = enteredRemark.trim();
    }

    setIsUpdatingSupervisorStatus(`${order.id}`);
    setSupervisorFeedback(null);

    try {
      await axiosInstance.patch(`/masters/orders/${order.id}/status`, {
        status: nextStatus,
        remark,
      });

      setSupervisorFeedback({
        type: "success",
        text:
          nextStatus === "Cancel"
            ? "Order has been canceled successfully."
            : "Order status changed successfully. Now you can edit the order.",
      });

      await fetchSupervisorOrders();
    } catch (err) {
      setSupervisorFeedback({
        type: "error",
        text: getApiErrorMessage(err, "Unable to update the order status."),
      });
    } finally {
      setIsUpdatingSupervisorStatus(null);
    }
  };

  useEffect(() => {
    setSupervisorCurrentPage(1);
  }, [supervisorFilters.fileNumber, supervisorFilters.subjectAddress, supervisorPageSize]);

  const reloadClientOrders = async () => {
    const username = user?.username || user?.email || undefined;
    const response = await axiosInstance.get("/masters/reports/orders", {
      params: { createdby: username, pageSize: 100 },
    });
    const next = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
    setClientOrders(next);
  };

  const handleClientStatusChange = async (
    orderId: string | number,
    nextStatus: string,
    currentStatus: string,
  ) => {
    if (!nextStatus || nextStatus === currentStatus) return;
    if (nextStatus === "Cancel") {
      setClientCancelModal({ id: orderId });
      setClientCancelRemark("");
      return;
    }
    if (nextStatus === "Reopen") {
      const confirmed = window.confirm("Are you sure? You want to Reopen this order.");
      if (!confirmed) return;
    }
    setClientUpdatingStatus(`${orderId}`);
    setClientFeedback(null);
    try {
      await axiosInstance.patch(`/masters/orders/${orderId}/status`, { status: nextStatus });
      setClientFeedback({
        type: "success",
        text: "Order status changed successfully. Now you can edit the order.",
      });
      await reloadClientOrders();
    } catch (err) {
      setClientFeedback({
        type: "error",
        text: getApiErrorMessage(err, "Unable to update order status."),
      });
    } finally {
      setClientUpdatingStatus(null);
    }
  };

  const handleClientCancelConfirm = async () => {
    if (!clientCancelModal || !clientCancelRemark.trim()) return;
    setClientUpdatingStatus(`${clientCancelModal.id}`);
    setClientFeedback(null);
    try {
      await axiosInstance.patch(`/masters/orders/${clientCancelModal.id}/status`, {
        status: "Cancel",
        remark: clientCancelRemark.trim(),
      });
      setClientCancelModal(null);
      setClientCancelRemark("");
      setClientFeedback({ type: "success", text: "Order has been canceled successfully." });
      await reloadClientOrders();
    } catch (err) {
      setClientFeedback({
        type: "error",
        text: getApiErrorMessage(err, "Unable to cancel the order."),
      });
    } finally {
      setClientUpdatingStatus(null);
    }
  };

  const handleClientRating = async (orderId: string | number, rating: number) => {
    const order = clientOrders.find((o) => `${o.id}` === `${orderId}`);
    if (Number(order?.feedback_rating ?? 0) > 0) {
      window.alert("Feedback for this order is already done.");
      return;
    }
    try {
      await axiosInstance.patch(`/masters/orders/${orderId}/feedback`, {
        feedback_rating: rating,
      });
      window.location.href = `/client/feedback-form?id=${orderId}`;
    } catch (err) {
      setClientFeedback({
        type: "error",
        text: getApiErrorMessage(err, "Unable to submit rating."),
      });
    }
  };

  const openClientDownloads = async (orderId: string | number) => {
    setClientDownloadsModal({ orderId, items: [], loading: true });
    try {
      const response = await axiosInstance.get(`/masters/reports/orders/${orderId}/details`);
      const items = Array.isArray(response.data?.completedDownloads)
        ? response.data.completedDownloads
        : [];
      setClientDownloadsModal({ orderId, items, loading: false });
    } catch {
      setClientDownloadsModal({ orderId, items: [], loading: false });
    }
  };

  const openClientComments = (order: ClientDashboardOrder) => {
    const text =
      order.emp_remark?.trim() ||
      order.remark?.trim() ||
      order.reply?.trim() ||
      "No Comments Found!!";
    setClientCommentsModal({ orderId: order.id, text });
  };

  useEffect(() => {
    setAdminCurrentPage(1);
  }, [orderFilters.clientName, orderFilters.fileNumber, orderFilters.subjectAddress, orderPageSize]);

  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [transactionPageSize]);

  const supervisorItemsPerPage = Number(supervisorPageSize) || 25;
  const adminItemsPerPage = Number(orderPageSize) || 25;
  const transactionItemsPerPage = Number(transactionPageSize) || 5;

  const supervisorTotalPages = Math.max(
    1,
    Math.ceil(supervisorOrders.length / supervisorItemsPerPage),
  );
  const adminTotalPages = Math.max(1, Math.ceil(adminOrders.length / adminItemsPerPage));
  const transactionTotalPages = Math.max(
    1,
    Math.ceil(adminTransactions.length / transactionItemsPerPage),
  );

  const safeSupervisorPage = Math.min(supervisorCurrentPage, supervisorTotalPages);
  const safeAdminPage = Math.min(adminCurrentPage, adminTotalPages);
  const safeTransactionPage = Math.min(transactionCurrentPage, transactionTotalPages);

  const visibleSupervisorOrders = supervisorOrders.slice(
    (safeSupervisorPage - 1) * supervisorItemsPerPage,
    safeSupervisorPage * supervisorItemsPerPage,
  );
  const visibleAdminOrders = adminOrders.slice(
    (safeAdminPage - 1) * adminItemsPerPage,
    safeAdminPage * adminItemsPerPage,
  );
  const visibleAdminTransactions = adminTransactions.slice(
    (safeTransactionPage - 1) * transactionItemsPerPage,
    safeTransactionPage * transactionItemsPerPage,
  );
  const adminStats = [
    {
      title: "Orders",
      href: "/reports/order-reports",
      value: standardFormat(summary.overview.orders.value),
      icon: "📦",
    },
    {
      title: "BackBone-Employees",
      href: "/users/employee-management",
      value: standardFormat(employeeCount),
      icon: "👥",
    },
    {
      title: "BackBone-Clients",
      href: "/users/client-management",
      value: standardFormat(summary.overview.clients.value),
      icon: "💼",
    },
    {
      title: "Transactions",
      href: "/reports/transaction-reports",
      value: standardFormat(adminTransactions.length),
      icon: "💳",
    },
  ];

  if (isClientUser) {
    const newOrdersCount = clientOrders.filter((o) => o.status === "New Order").length;
    const inProgressCount = clientOrders.filter((o) => o.status === "Accept").length;
    const completedCount = clientOrders.filter((o) => o.status === "Completed").length;
    const walletBalance = Number(user?.wallete_balance ?? 0);
    const filteredClientOrders = clientOrders.filter((o) => {
      if (clientFileFilter && !`${o.id}`.includes(clientFileFilter)) return false;
      if (
        clientAddressFilter &&
        !(o.subject_address ?? "").toLowerCase().includes(clientAddressFilter.toLowerCase())
      )
        return false;
      return true;
    });
    const totalClientPages = Math.max(1, Math.ceil(filteredClientOrders.length / clientPageSize));
    const safeClientPage = Math.min(clientCurrentPage, totalClientPages);
    const visibleClientOrders = filteredClientOrders.slice(
      (safeClientPage - 1) * clientPageSize,
      safeClientPage * clientPageSize,
    );

    return (
      <div className="space-y-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
            {error}
          </div>
        )}
        {clientFeedback && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              clientFeedback.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {clientFeedback.text}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-stroke bg-white px-6 py-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Client Workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-dark dark:text-white">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-dark-5">
            Track order progress, manage updates, and review completed files in one place.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/reports/account-report"
            className="rounded-xl border border-stroke bg-white p-5 shadow-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-card dark:border-dark-3 dark:bg-gray-dark"
          >
            <p className="text-sm font-medium text-dark-5 dark:text-dark-6">Wallet</p>
            <p className="mt-1 text-xl font-bold text-primary">
              ({walletBalance} Credits)
            </p>
          </Link>
          <Link
            href="/client/new-order"
            className="rounded-xl border border-stroke bg-white p-5 shadow-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-card dark:border-dark-3 dark:bg-gray-dark"
          >
            <p className="text-sm font-medium text-dark-5 dark:text-dark-6">New Orders</p>
            <p className="mt-1 text-xl font-bold text-primary">
              ({newOrdersCount})
            </p>
          </Link>
          <Link
            href="/reports/order-reports"
            className="rounded-xl border border-stroke bg-white p-5 shadow-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-card dark:border-dark-3 dark:bg-gray-dark"
          >
            <p className="text-sm font-medium text-dark-5 dark:text-dark-6">In Progress Orders</p>
            <p className="mt-1 text-xl font-bold text-primary">
              ({inProgressCount})
            </p>
          </Link>
          <Link
            href="/reports/order-reports"
            className="rounded-xl border border-stroke bg-white p-5 shadow-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-card dark:border-dark-3 dark:bg-gray-dark"
          >
            <p className="text-sm font-medium text-dark-5 dark:text-dark-6">Completed Orders</p>
            <p className="mt-1 text-xl font-bold text-primary">
              ({completedCount})
            </p>
          </Link>
          <div className="rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:col-span-2 xl:col-span-1">
            <p className="mb-2 font-semibold text-dark dark:text-white">Notes</p>
            <ol className="space-y-1 text-sm text-dark-5 dark:text-dark-6">
              <li>1. On each completed report 1 bonus point will be added.</li>
              <li>
                2. On each star review rating for any order 1 point will be added. E.g. 1 Star = 1
                Point, 5 Stars = 5 Points and so on.
              </li>
              <li>
                3. Earn 60 credit points on each reference of your friend, partner with sign up +
                activation.
              </li>
            </ol>
          </div>
        </div>

        {/* Latest Orders Table */}
        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <div className="border-b border-stroke bg-gray-1 px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <h4 className="text-lg font-semibold text-dark dark:text-white">Latest Orders</h4>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={clientPendingFileFilter}
                  onChange={(e) => setClientPendingFileFilter(e.target.value)}
                  placeholder="File #"
                  className="w-[130px] rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
                <input
                  type="text"
                  value={clientPendingAddressFilter}
                  onChange={(e) => setClientPendingAddressFilter(e.target.value)}
                  placeholder="Subject Address"
                  className="w-[200px] rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setClientFileFilter(clientPendingFileFilter.trim());
                    setClientAddressFilter(clientPendingAddressFilter.trim());
                    setClientCurrentPage(1);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  Search
                </button>
                <select
                  value={clientPageSize}
                  onChange={(e) => {
                    setClientPageSize(Number(e.target.value));
                    setClientCurrentPage(1);
                  }}
                  className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!filteredClientOrders.length) {
                      window.alert("No data to export.");
                      return;
                    }
                    const headers = [
                      "File#",
                      "Property Address",
                      "TAT",
                      "Order Date",
                      "Status",
                      "Completed Date",
                    ];
                    const csvRows = filteredClientOrders.map((o) => [
                      o.id,
                      o.subject_address || "",
                      o.package || "",
                      formatDateTime(o.created_date),
                      o.status || "",
                      formatDateTime(o.modify_date),
                    ]);
                    const csv = [headers, ...csvRows]
                      .map((r) =>
                        r.map((c) => `"${`${c}`.replace(/"/g, '""')}"`).join(","),
                      )
                      .join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "Dashboard_Orders.csv";
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  Get Data
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-1 pb-1">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-2 [&>th]:whitespace-nowrap [&>th]:text-dark dark:bg-dark-2 dark:[&>th]:text-white">
                    <TableHead>File#</TableHead>
                    <TableHead>Property Address</TableHead>
                    <TableHead>TAT</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Update Status</TableHead>
                    <TableHead>Completed Report Files</TableHead>
                    <TableHead>BDS Comments</TableHead>
                    <TableHead>Change In Order</TableHead>
                    <TableHead>Rate Us</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-dark-5">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : visibleClientOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-dark-5">
                        No Data Found !
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleClientOrders.map((order) => {
                      const statusCfg = getSupervisorStatusOptions(order.status);
                      const currentStatus = `${order.status ?? statusCfg.options[0] ?? ""}`;
                      const isUpdating = clientUpdatingStatus === `${order.id}`;
                      const normalizedStatus = currentStatus.toLowerCase();
                      const canEdit =
                        normalizedStatus !== "completed" && normalizedStatus !== "cancel";
                      const existingRating = Number(order.feedback_rating ?? 0);
                      const isCompleted = normalizedStatus === "completed";

                      return (
                        <TableRow
                          key={order.id}
                          className={`${getTatRowClassName(order.package)} hover:bg-gray-1 dark:hover:bg-dark-2`}
                        >
                          <TableCell>
                            <Link
                              href={`/orders/details/${order.id}`}
                              className="font-medium text-primary underline underline-offset-2"
                            >
                              {order.id}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal">
                            {order.subject_address || "—"}
                          </TableCell>
                          <TableCell>{order.package || "—"}</TableCell>
                          <TableCell>{formatDateTime(order.created_date)}</TableCell>
                          <TableCell>
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                void handleClientStatusChange(
                                  order.id,
                                  e.target.value,
                                  currentStatus,
                                )
                              }
                              disabled={statusCfg.disabled || isUpdating}
                              className="min-w-[120px] rounded-lg border border-stroke bg-white px-2 py-1.5 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                            >
                              {statusCfg.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              title="Download Completed Files"
                              onClick={() => void openClientDownloads(order.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke transition hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="11" x2="12" y2="17" />
                                <polyline points="9 14 12 17 15 14" />
                              </svg>
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              title="BDS Comments"
                              onClick={() => openClientComments(order)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke transition hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                            </button>
                          </TableCell>
                          <TableCell>
                            {canEdit ? (
                              <Link
                                href={`/client/edit-order?oid=${order.id}`}
                                title="Change In Order"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke transition hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </Link>
                            ) : (
                              <span className="text-xs text-dark-5">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCompleted ? (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => void handleClientRating(order.id, star)}
                                    className={`text-lg leading-none transition hover:scale-105 hover:text-primary ${
                                      star <= existingRating
                                        ? "text-primary"
                                        : "text-gray-300 dark:text-gray-600"
                                    }`}
                                    title={`Rate ${star}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-dark-5">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t border-stroke px-5 py-4 dark:border-dark-3">
            <TablePagination
              page={safeClientPage}
              totalPages={totalClientPages}
              totalItems={filteredClientOrders.length}
              itemsPerPage={clientPageSize}
              onPageChange={setClientCurrentPage}
              label="orders"
            />
          </div>
        </div>

        {/* Cancel Order Modal */}
        {clientCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
              <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                Enter Comment For Cancellation <span className="text-red-500">*</span>
              </h3>
              <textarea
                value={clientCancelRemark}
                onChange={(e) => setClientCancelRemark(e.target.value)}
                rows={4}
                placeholder="Enter remark for cancellation..."
                className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setClientCancelModal(null);
                    setClientCancelRemark("");
                  }}
                  className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void handleClientCancelConfirm()}
                  disabled={!clientCancelRemark.trim() || clientUpdatingStatus !== null}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Downloads Modal */}
        {clientDownloadsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Completed Work Attachments — File #{clientDownloadsModal.orderId}
                </h3>
                <button
                  type="button"
                  onClick={() => setClientDownloadsModal(null)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Close
                </button>
              </div>
              {clientDownloadsModal.loading ? (
                <p className="py-4 text-center text-dark-5">Loading...</p>
              ) : clientDownloadsModal.items.length === 0 ? (
                <p className="py-4 text-center text-dark-5">No Files Found Here!</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke dark:border-dark-3">
                      <th className="pb-2 text-left font-medium text-dark dark:text-white">
                        Type
                      </th>
                      <th className="pb-2 text-left font-medium text-dark dark:text-white">
                        File Name
                      </th>
                      <th className="pb-2 text-left font-medium text-dark dark:text-white">
                        Download
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientDownloadsModal.items.map((item) => {
                      const href = getAttachmentUrl(item.filepath);
                      return (
                        <tr key={item.id} className="border-b border-stroke dark:border-dark-3">
                          <td className="py-2 text-dark-5">{item.type || "—"}</td>
                          <td className="py-2 text-dark dark:text-white">
                            {item.filename || "—"}
                          </td>
                          <td className="py-2">
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary underline underline-offset-2"
                              >
                                Open
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* BDS Comments Modal */}
        {clientCommentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Comments For Completed Work
                </h3>
                <button
                  type="button"
                  onClick={() => setClientCommentsModal(null)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Close
                </button>
              </div>
              <div className="rounded-lg bg-gray-1 px-4 py-4 text-sm text-dark dark:bg-dark-3 dark:text-white">
                {clientCommentsModal.text}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isSupervisorUser) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
            {error}
          </div>
        )}

        {supervisorFeedback && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              supervisorFeedback.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {supervisorFeedback.text}
          </div>
        )}

        <div className="overflow-hidden rounded-[12px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <div className="border-b border-stroke bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent px-5 py-4 dark:border-dark-3">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Supervisor Dashboard</p>
                <h3 className="text-xl font-semibold text-dark dark:text-white">Order Queue</h3>
                <p className="mt-1 text-sm text-dark-5">
                  Use search and horizontal scroll to review every column cleanly.
                </p>
              </div>

              <form
                onSubmit={handleSupervisorSearch}
                className="flex flex-wrap items-center gap-3"
              >
              <input
                type="text"
                value={supervisorPendingFilters.fileNumber}
                onChange={(event) =>
                  setSupervisorPendingFilters((current) => ({
                    ...current,
                    fileNumber: event.target.value,
                  }))
                }
                placeholder="File #"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white md:w-[150px]"
              />
              <input
                type="text"
                value={supervisorPendingFilters.subjectAddress}
                onChange={(event) =>
                  setSupervisorPendingFilters((current) => ({
                    ...current,
                    subjectAddress: event.target.value,
                  }))
                }
                placeholder="Subject Address"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white md:w-[220px]"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleSupervisorExport}
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
              >
                Get Data
              </button>
            </form>
            </div>
          </div>

          <div className="overflow-x-auto px-1 pb-1">
            <div className="min-w-[1450px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-2 [&>th]:whitespace-nowrap [&>th]:text-dark dark:bg-dark-2 dark:[&>th]:text-white">
                  <TableHead>Sr. No.</TableHead>
                  <TableHead>File#</TableHead>
                  <TableHead>TAT</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Property Address</TableHead>
                  <TableHead>Change Status</TableHead>
                  <TableHead>Client Rating</TableHead>
                  <TableHead>Client Feedback</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>Remaining TAT</TableHead>
                  <TableHead>Completed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSupervisorOrders ? (
                  <TableRow>
                    <TableCell colSpan={15} className="py-6 text-center text-dark-5">
                      Loading dashboard orders...
                    </TableCell>
                  </TableRow>
                ) : supervisorOrdersError ? (
                  <TableRow>
                    <TableCell colSpan={15} className="py-6 text-center text-red-600">
                      {supervisorOrdersError}
                    </TableCell>
                  </TableRow>
                ) : visibleSupervisorOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="py-6 text-center text-dark-5">
                      No Data Found !
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleSupervisorOrders.map((order, index) => {
                    const statusConfig = getSupervisorStatusOptions(order.status);
                    const currentStatus = `${order.status ?? statusConfig.options[0] ?? ""}`;

                    return (
                      <TableRow
                        key={`${order.id}-${index}`}
                        className={`${getTatRowClassName(order.package)} hover:bg-gray-1 dark:hover:bg-dark-2`}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Link href={`/orders/details/${order.id}`} className="underline">
                            {order.id}
                          </Link>
                        </TableCell>
                        <TableCell>{order.package || order.tat || "-"}</TableCell>
                        <TableCell>{formatDateTime(order.created_date)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClassName(order.status)}`}>
                            {order.status || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{order.createdby || "-"}</TableCell>
                        <TableCell>{order.client_name || "-"}</TableCell>
                        <TableCell>{order.subject_address || "-"}</TableCell>
                        <TableCell>
                          <select
                            value={currentStatus}
                            onChange={(event) =>
                              void handleSupervisorStatusChange(order, event.target.value)
                            }
                            disabled={
                              statusConfig.disabled ||
                              isUpdatingSupervisorStatus === `${order.id}`
                            }
                            className="min-w-[120px] rounded-md border border-stroke bg-transparent px-2 py-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:text-white"
                          >
                            {statusConfig.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>{order.feedback_rating ?? "-"}</TableCell>
                        <TableCell>{order.feedback || "-"}</TableCell>
                        <TableCell>{order.assigner_name || "-"}</TableCell>
                        <TableCell>
                          <Link
                            href={`/chat-system?id=${order.id}`}
                            title="Send Message"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stroke hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15a2 2 0 0 1 -2 2h-4l-4 4v-4h-6a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </Link>
                        </TableCell>
                        <TableCell>{order.remaining_tat || "-"}</TableCell>
                        <TableCell>{formatDateTime(order.modify_date)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          <div className="border-t border-stroke px-5 py-4 dark:border-dark-3">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2 text-sm text-dark-5">
                <span>Rows per page</span>
                <select
                  value={supervisorPageSize}
                  onChange={(event) => setSupervisorPageSize(event.target.value)}
                  className="w-[100px] rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              <TablePagination
                page={safeSupervisorPage}
                totalPages={supervisorTotalPages}
                totalItems={supervisorOrders.length}
                itemsPerPage={supervisorItemsPerPage}
                onPageChange={setSupervisorCurrentPage}
                label="orders"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTeamMemberUser) {
    const acceptedOrders = memberOrders.filter(
      (order) => (order.status || "").toLowerCase() === "accept",
    ).length;
    const activeOrders = memberOrders.filter((order) => {
      const status = (order.status || "").toLowerCase();
      return status === "accept" || status === "work in progress";
    }).length;
    const completedOrders = memberOrders.filter(
      (order) => (order.status || "").toLowerCase() === "completed",
    ).length;

    return (
      <div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <OverviewCard
            label="Accepted Orders"
            data={{ value: compactFormat(acceptedOrders), growthRate: 0 }}
            Icon={icons.Product}
          />
          <OverviewCard
            label="Active Orders"
            data={{ value: compactFormat(activeOrders), growthRate: 0 }}
            Icon={icons.Views}
          />
          <OverviewCard
            label="Completed Orders"
            data={{ value: compactFormat(completedOrders), growthRate: 0 }}
            Icon={icons.Users}
          />
          <OverviewCard
            label="My Role"
            data={{ value: "Team Member", growthRate: 0 }}
            Icon={icons.Profit}
          />
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
          <div className="col-span-12 rounded-[10px] bg-white p-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-4">
            <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
              Team Member Dashboard
            </h2>
            <p className="mt-1 text-sm text-dark-5">
              Access the same team-member order flow from the legacy system.
            </p>

            <div className="mt-5 grid gap-3">
              <Link href="/orders/new-order" className="rounded-lg border border-stroke px-4 py-3 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white">
                Open New Orders
              </Link>
              <Link href="/orders/assigned-orders" className="rounded-lg border border-stroke px-4 py-3 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white">
                Orders Assigned
              </Link>
              <Link href="/reports/order-reports" className="rounded-lg border border-stroke px-4 py-3 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white">
                Open Order Report
              </Link>
            </div>
          </div>

          <div className="col-span-12 rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-body-2xlg font-bold text-dark dark:text-white">Recent Assigned Orders</h2>
              <Link href="/orders/assigned-orders" className="text-sm font-medium text-primary">
                View All
              </Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File #</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-dark-5">
                      {isLoading ? "Loading assigned orders..." : "No assigned orders found yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  memberOrders.slice(0, 8).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.subject_address || "-"}</TableCell>
                      <TableCell>{order.package || "-"}</TableCell>
                      <TableCell>{order.status || "-"}</TableCell>
                      <TableCell>{formatDateTime(order.created_date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4">
          {error}
        </div>
      )}

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[30px] font-semibold text-dark dark:text-white max-sm:text-[20px]">
              Dashboard
            </h2>
          </div>

          <Link
            href="/orders/place-new-order"
            className="inline-flex items-center justify-center gap-3 rounded-md bg-primary px-4 py-3 text-white hover:bg-primary/90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm font-bold sm:text-[22px]">PLACE NEW ORDER</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="overflow-hidden rounded-[10px] border border-stroke bg-white shadow-1 transition hover:-translate-y-0.5 hover:shadow-card dark:border-dark-3 dark:bg-gray-dark"
          >
            <div className="flex items-center justify-between border-b border-stroke px-4 py-3 dark:border-dark-3">
              <span className="text-sm font-semibold text-dark dark:text-white">{item.title}</span>
              <span className="text-xl">{item.icon}</span>
            </div>
            <div className="px-4 py-5">
              <p className="text-3xl font-bold text-dark dark:text-white">{item.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="border-b border-stroke px-5 py-4 dark:border-dark-3">
          <form
            onSubmit={handleDashboardSearch}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_0.8fr_1.2fr_auto_auto]"
          >
            <input
              type="text"
              value={pendingOrderFilters.clientName}
              onChange={(event) =>
                setPendingOrderFilters((current) => ({
                  ...current,
                  clientName: event.target.value,
                }))
              }
              placeholder="Client Name"
              className="rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <input
              type="text"
              value={pendingOrderFilters.fileNumber}
              onChange={(event) =>
                setPendingOrderFilters((current) => ({
                  ...current,
                  fileNumber: event.target.value,
                }))
              }
              placeholder="File #"
              className="rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <input
              type="text"
              value={pendingOrderFilters.subjectAddress}
              onChange={(event) =>
                setPendingOrderFilters((current) => ({
                  ...current,
                  subjectAddress: event.target.value,
                }))
              }
              placeholder="Subject Address"
              className="rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleDashboardExport}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Get Data
            </button>
          </form>
        </div>

        <div className="overflow-x-auto px-1 pb-1">
          <div className="min-w-[1500px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-2 [&>th]:whitespace-nowrap [&>th]:text-dark dark:bg-dark-2 dark:[&>th]:text-white">
                <TableHead>Sr. No.</TableHead>
                <TableHead>File#</TableHead>
                <TableHead>TAT</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Property Address</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Client Feedback</TableHead>
                <TableHead>Client Rating</TableHead>
                <TableHead>Remaining TAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAdminOrders ? (
                <TableRow>
                  <TableCell colSpan={16} className="py-6 text-center text-dark-5">
                    Loading dashboard orders...
                  </TableCell>
                </TableRow>
              ) : adminOrdersError ? (
                <TableRow>
                  <TableCell colSpan={16} className="py-6 text-center text-red-600">
                    {adminOrdersError}
                  </TableCell>
                </TableRow>
              ) : visibleAdminOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="py-6 text-center text-dark-5">
                    No Data Found !
                  </TableCell>
                </TableRow>
              ) : (
                visibleAdminOrders.map((order, index) => (
                  <TableRow key={`${order.id}-${index}`} className={getTatRowClassName(order.package)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link href={`/orders/details/${order.id}`} className="underline">
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell>{order.package || order.tat || "-"}</TableCell>
                    <TableCell>{formatCurrency(order.amount)}</TableCell>
                    <TableCell>{formatDateTime(order.created_date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClassName(order.status)}`}>
                        {order.status || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{order.createdby || "-"}</TableCell>
                    <TableCell>
                      <Link
                        href={`/chat-system?id=${order.id}`}
                        title="Send Message"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stroke hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 20l1.3-3.9A9 8 0 1 1 7.7 19L3 20z" />
                          <line x1="8" y1="12" x2="8.01" y2="12" />
                          <line x1="12" y1="12" x2="12.01" y2="12" />
                          <line x1="16" y1="12" x2="16.01" y2="12" />
                        </svg>
                      </Link>
                    </TableCell>
                    <TableCell>{order.client_name || "-"}</TableCell>
                    <TableCell>{order.email || "-"}</TableCell>
                    <TableCell>{order.subject_address || "-"}</TableCell>
                    <TableCell>{order.assigner_name || "-"}</TableCell>
                    <TableCell>{formatDateTime(order.modify_date)}</TableCell>
                    <TableCell>{order.feedback || "-"}</TableCell>
                    <TableCell>{order.feedback_rating ?? "-"}</TableCell>
                    <TableCell>{order.remaining_tat || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        <div className="border-t border-stroke p-4 dark:border-dark-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm text-dark-5">
              <span>Rows per page</span>
              <select
                value={orderPageSize}
                onChange={(event) => setOrderPageSize(event.target.value)}
                className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <TablePagination
              page={safeAdminPage}
              totalPages={adminTotalPages}
              totalItems={adminOrders.length}
              itemsPerPage={adminItemsPerPage}
              onPageChange={setAdminCurrentPage}
              label="orders"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="border-b border-stroke px-5 py-4 dark:border-dark-3">
          <h4 className="text-lg font-semibold text-dark dark:text-white">Last Transactions</h4>
        </div>

        <div className="overflow-x-auto px-1 pb-1">
          <div className="min-w-[1050px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-2 [&>th]:whitespace-nowrap [&>th]:text-dark dark:bg-dark-2 dark:[&>th]:text-white">
                <TableHead>Sr. No.</TableHead>
                <TableHead>created by</TableHead>
                <TableHead>Transaction Amount ($)</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Transaction Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAdminTransactions ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-dark-5">
                    Loading last transactions...
                  </TableCell>
                </TableRow>
              ) : adminTransactionsError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-red-600">
                    {adminTransactionsError}
                  </TableCell>
                </TableRow>
              ) : visibleAdminTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-dark-5">
                    No Data Found !
                  </TableCell>
                </TableRow>
              ) : (
                visibleAdminTransactions.map((transaction, index) => (
                  <TableRow key={`${transaction.id}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{transaction.createdby || "-"}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{transaction.client_name || "-"}</TableCell>
                    <TableCell>{transaction.email || "-"}</TableCell>
                    <TableCell>{transaction.transaction_id || transaction.id}</TableCell>
                    <TableCell>{formatDateTime(transaction.created_date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClassName(transaction.status)}`}>
                        {transaction.status || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        <div className="border-t border-stroke p-4 dark:border-dark-3">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm text-dark-5">
              <span>Rows per page</span>
              <select
                value={transactionPageSize}
                onChange={(event) => setTransactionPageSize(event.target.value)}
                className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <TablePagination
              page={safeTransactionPage}
              totalPages={transactionTotalPages}
              totalItems={adminTransactions.length}
              itemsPerPage={transactionItemsPerPage}
              onPageChange={setTransactionCurrentPage}
              label="transactions"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
