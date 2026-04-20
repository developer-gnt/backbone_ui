"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type ClientRow = {
  id: number;
  status: string | null;
  select_type?: string | null;
  type?: string | null;
  companyname: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  mobileno: string | null;
  referedby: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  date: string | null;
  username: string | null;
  password_preview?: string | null;
};

type AlertState = {
  type: "success" | "error";
  text: string;
} | null;

const CLIENT_TYPE_OPTIONS = [
  { value: "0", label: "Regular Appraiser" },
  { value: "1", label: "Staff Appraiser" },
  { value: "2", label: "Appraisal Company" },
];

const DEFAULT_FILTERS = {
  name: "",
  email: "",
  username: "",
  pageSize: "50",
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-GB");
};

const getNormalizedStatus = (status?: string | null) =>
  `${status || "pending"}`.trim().toLowerCase();

function CheckIcon() {
  return (
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 12l5 5l10 -10" />
    </svg>
  );
}

function PauseIconSvg() {
  return (
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 9v6" />
      <path d="M14 9v6" />
      <path d="M5 5m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />
    </svg>
  );
}

function HoldIcon() {
  return (
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8 9l3 3l-3 3" />
      <path d="M13 15l3 -3l-3 -3" />
      <path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />
    </svg>
  );
}

function TerminateIcon() {
  return (
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18.364 5.636l-12.728 12.728" />
      <path d="M5.636 5.636l12.728 12.728" />
    </svg>
  );
}

function DeleteIcon() {
  return (
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 12l5 5l10 -10" />
    </svg>
  );
}

const ClientManagement = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftTypes, setDraftTypes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>(null);

  const fetchClients = useCallback(async (nextFilters = filters) => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/user/clients", {
        params: {
          name: nextFilters.name,
          email: nextFilters.email,
          username: nextFilters.username,
          pageSize: nextFilters.pageSize,
        },
      });

      const rows = Array.isArray(response.data) ? response.data : [];
      setClients(rows);
      setDraftTypes(
        rows.reduce<Record<number, string>>((acc, client) => {
          acc[client.id] = `${client.select_type ?? client.type ?? "0"}`;
          return acc;
        }, {}),
      );
    } catch (error) {
      setClients([]);
      setAlertState({
        type: "error",
        text: getApiErrorMessage(error, "Unable to load clients."),
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await fetchClients(filters);
  };

  const handlePageSizeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextFilters = { ...filters, pageSize: e.target.value };
    setFilters(nextFilters);
    await fetchClients(nextFilters);
  };

  const applyClientType = async (client: ClientRow) => {
    const nextType = draftTypes[client.id] ?? `${client.select_type ?? client.type ?? "0"}`;
    setBusyAction(`type-${client.id}`);

    try {
      await axiosInstance.patch(`/user/${client.id}`, {
        type: nextType,
      });

      window.alert("Client Type has been changed");
      setAlertState({
        type: "success",
        text: "Client Type has been changed",
      });
      await fetchClients(filters);
    } catch (error) {
      setAlertState({
        type: "error",
        text: getApiErrorMessage(error, "FAILED TO ACTIVATE CLIENT"),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const sendLoginDetails = async (client: ClientRow) => {
    setBusyAction(`mail-${client.id}`);

    try {
      const response = await axiosInstance.post(
        `/user/${client.id}/send-login-details`,
      );

      window.alert("Login details has been sent successfully.");
      setAlertState({
        type: "success",
        text:
          response.data?.message || "Login details has been sent successfully.",
      });

      if (response.data?.preview) {
        const preview = response.data.preview;
        window.alert(
          `Username: ${preview.username || "-"}\nPassword: ${preview.password || "-"}\nLogin URL: ${preview.loginUrl || "-"}`,
        );
      }
    } catch (error) {
      setAlertState({
        type: "error",
        text: getApiErrorMessage(error, "FAILED TO ACTIVATE CLIENT"),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const changeStatus = async (client: ClientRow, status: string) => {
    setBusyAction(`status-${client.id}-${status}`);

    try {
      if (status === "Active") {
        const nextType = draftTypes[client.id] ?? `${client.select_type ?? client.type ?? "0"}`;
        await axiosInstance.patch(`/user/${client.id}`, { type: nextType });
      }

      await axiosInstance.patch(`/user/${client.id}/status`, { status });

      if (status === "Active") {
        try {
          await axiosInstance.post(`/user/${client.id}/send-login-details`);
        } catch {
          // keep status update working even if SMTP is not configured
        }
      }

      const successMessage =
        status === "Active"
          ? "Client activated successfully"
          : status === "Deactive"
            ? "Client DEACTIVATED successfully"
            : status === "Hold"
              ? "Client is on Hold"
              : "Client Terminated successfully";

      window.alert(successMessage);
      setAlertState({ type: "success", text: successMessage });
      await fetchClients(filters);
    } catch (error) {
      setAlertState({
        type: "error",
        text: getApiErrorMessage(error, "FAILED TO ACTIVATE CLIENT"),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const deleteClient = async (client: ClientRow) => {
    const confirmed = window.confirm("Delete this client?");

    if (!confirmed) {
      return;
    }

    setBusyAction(`delete-${client.id}`);

    try {
      await axiosInstance.delete(`/user/${client.id}`);
      window.alert("Client is Deleted");
      setAlertState({ type: "success", text: "Client is Deleted" });
      await fetchClients(filters);
    } catch (error) {
      setAlertState({
        type: "error",
        text: getApiErrorMessage(error, "FAILED TO DELETE CLIENT"),
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-6">
      <div className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-dark dark:text-white">
              Backbone Data Solutions Clients Overview
            </h2>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid w-full max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Client Name"
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <input
              type="text"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Email Address"
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <input
              type="text"
              name="username"
              value={filters.username}
              onChange={handleFilterChange}
              placeholder="User Name"
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {alertState && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            alertState.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {alertState.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-[2100px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead>#</TableHead>
              <TableHead>#</TableHead>
              <TableHead>#</TableHead>
              <TableHead>Sr. No.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Select Type</TableHead>
              <TableHead>Login Details</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Reference Source</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Zip Code</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Password</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={20} className="py-8 text-center text-dark-5">
                  Loading clients...
                </TableCell>
              </TableRow>
            ) : clients.length ? (
              clients.map((client, index) => {
                const status = getNormalizedStatus(client.status);
                const typeValue = draftTypes[client.id] ?? `${client.select_type ?? client.type ?? "0"}`;

                const showActivate =
                  status === "hold" ||
                  status === "pending" ||
                  status === "deactive";
                const showDeactivate = status === "active";
                const showHold = status === "pending";
                const showTerminate =
                  status === "active" || status === "hold" || status === "deactive";
                const disableActivate = status === "terminate";
                const disableTerminate = status === "terminate";

                return (
                  <TableRow key={client.id} className="border-[#eee] dark:border-dark-3">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {showActivate ? (
                          <button
                            type="button"
                            title="Activate"
                            disabled={busyAction === `status-${client.id}-Active` || disableActivate}
                            onClick={() => changeStatus(client, "Active")}
                            className="text-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckIcon />
                          </button>
                        ) : (
                          <span className="inline-block h-5 w-5" />
                        )}

                        {showDeactivate ? (
                          <button
                            type="button"
                            title="Deactivate"
                            disabled={busyAction === `status-${client.id}-Deactive`}
                            onClick={() => changeStatus(client, "Deactive")}
                            className="text-yellow-600 hover:text-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <PauseIconSvg />
                          </button>
                        ) : (
                          <span className="inline-block h-5 w-5" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {showHold ? (
                          <button
                            type="button"
                            title="Hold"
                            disabled={busyAction === `status-${client.id}-Hold`}
                            onClick={() => changeStatus(client, "Hold")}
                            className="text-amber-600 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <HoldIcon />
                          </button>
                        ) : (
                          <span className="inline-block h-5 w-5" />
                        )}

                        {showTerminate ? (
                          <button
                            type="button"
                            title="Terminate"
                            disabled={busyAction === `status-${client.id}-Terminate` || disableTerminate}
                            onClick={() => changeStatus(client, "Terminate")}
                            className="text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <TerminateIcon />
                          </button>
                        ) : (
                          <span className="inline-block h-5 w-5" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <button
                        type="button"
                        title="Delete"
                        disabled={busyAction === `delete-${client.id}`}
                        onClick={() => deleteClient(client)}
                        className="text-dark hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                      >
                        <DeleteIcon />
                      </button>
                    </TableCell>

                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{client.status || "pending"}</TableCell>
                    <TableCell>
                      <div className="flex min-w-[220px] items-center gap-2">
                        <select
                          value={typeValue}
                          onChange={(e) =>
                            setDraftTypes((current) => ({
                              ...current,
                              [client.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                        >
                          {CLIENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          title="Apply"
                          onClick={() => applyClientType(client)}
                          disabled={busyAction === `type-${client.id}`}
                          className="rounded-md border border-primary p-2 text-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <TickIcon />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => sendLoginDetails(client)}
                        disabled={busyAction === `mail-${client.id}`}
                        className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Send Login Details
                      </button>
                    </TableCell>
                    <TableCell>{client.companyname || "-"}</TableCell>
                    <TableCell>{client.firstname || "-"}</TableCell>
                    <TableCell>{client.lastname || "-"}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.mobileno || "-"}</TableCell>
                    <TableCell>{client.referedby || "-"}</TableCell>
                    <TableCell>{client.address || "-"}</TableCell>
                    <TableCell>{client.city || "-"}</TableCell>
                    <TableCell>{client.state || "-"}</TableCell>
                    <TableCell>{client.zipcode || "-"}</TableCell>
                    <TableCell>{formatDate(client.date)}</TableCell>
                    <TableCell>{client.username || "-"}</TableCell>
                    <TableCell>{client.password_preview || "-"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={20} className="py-8 text-center text-dark-5">
                  Clients Registrations Not Found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-3 flex justify-end">
          <select
            value={filters.pageSize}
            onChange={handlePageSizeChange}
            className="w-[100px] rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            {['50', '100', '250', '500'].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
