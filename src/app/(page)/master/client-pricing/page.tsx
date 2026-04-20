"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type ClientOption = {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  companyname?: string | null;
  username?: string | null;
  email?: string | null;
};

type TatPricingRow = {
  packageId: number;
  packageCode: string;
  displayLabel: string;
  tatHours: number;
  defaultPrice: number;
  effectivePrice: number;
  isOverridden: boolean;
  overrideId: number | null;
  overridePrice: number | null;
  overrideActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

type EditableTatPricingRow = TatPricingRow & {
  customPriceInput: string;
};

const getClientLabel = (client: ClientOption) => {
  const fullName = `${client.firstname ?? ""} ${client.lastname ?? ""}`.trim();
  return fullName || client.companyname || client.username || client.email || `Client #${client.id}`;
};

export default function ClientPricingPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [rows, setRows] = useState<EditableTatPricingRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [savingPackageId, setSavingPackageId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      setFeedback(null);

      try {
        const response = await axiosInstance.get("/user/clients", {
          params: { pageSize: "500" },
        });

        const nextClients = Array.isArray(response.data) ? response.data : [];
        setClients(nextClients);
        setSelectedUsername(
          nextClients[0]?.username || nextClients[0]?.email || "",
        );
      } catch (error) {
        setClients([]);
        setFeedback({
          type: "error",
          text: getApiErrorMessage(error, "Unable to load clients."),
        });
      } finally {
        setLoadingClients(false);
      }
    };

    void loadClients();
  }, []);

  useEffect(() => {
    const loadPricing = async () => {
      if (!selectedUsername) {
        setRows([]);
        return;
      }

      setLoadingRows(true);
      setFeedback(null);

      try {
        const response = await axiosInstance.get(
          `/admin/client-tat-pricing/${encodeURIComponent(selectedUsername)}`,
        );
        const packages = Array.isArray(response.data?.packages)
          ? response.data.packages
          : [];

        setRows(
          packages.map((item: TatPricingRow) => ({
            ...item,
            customPriceInput:
              item.overridePrice !== null && item.overridePrice !== undefined
                ? `${item.overridePrice}`
                : "",
          })),
        );
      } catch (error) {
        setRows([]);
        setFeedback({
          type: "error",
          text: getApiErrorMessage(error, "Unable to load client TAT pricing."),
        });
      } finally {
        setLoadingRows(false);
      }
    };

    void loadPricing();
  }, [selectedUsername]);

  const updateRow = (
    packageId: number,
    patch: Partial<EditableTatPricingRow>,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.packageId === packageId ? { ...row, ...patch } : row,
      ),
    );
  };

  const saveRow = async (row: EditableTatPricingRow) => {
    setSavingPackageId(row.packageId);
    setFeedback(null);

    try {
      if (!row.customPriceInput.trim()) {
        if (row.overrideId) {
          await axiosInstance.delete(`/admin/client-tat-pricing/${row.overrideId}`);
        }

        const refreshed = await axiosInstance.get(
          `/admin/client-tat-pricing/${encodeURIComponent(selectedUsername)}`,
        );
        const packages = Array.isArray(refreshed.data?.packages)
          ? refreshed.data.packages
          : [];
        setRows(
          packages.map((item: TatPricingRow) => ({
            ...item,
            customPriceInput:
              item.overridePrice !== null && item.overridePrice !== undefined
                ? `${item.overridePrice}`
                : "",
          })),
        );
        setFeedback({
          type: "success",
          text: `Reset ${row.displayLabel} to default pricing.`,
        });
        return;
      }

      await axiosInstance.post("/admin/client-tat-pricing", {
        username: selectedUsername,
        tatPackageId: row.packageId,
        customPrice: row.customPriceInput.trim(),
        isActive: true,
      });

      const refreshed = await axiosInstance.get(
        `/admin/client-tat-pricing/${encodeURIComponent(selectedUsername)}`,
      );
      const packages = Array.isArray(refreshed.data?.packages)
        ? refreshed.data.packages
        : [];
      setRows(
        packages.map((item: TatPricingRow) => ({
          ...item,
          customPriceInput:
            item.overridePrice !== null && item.overridePrice !== undefined
              ? `${item.overridePrice}`
              : "",
        })),
      );
      setFeedback({
        type: "success",
        text: `Saved pricing for ${row.displayLabel}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, `Unable to save pricing for ${row.displayLabel}.`),
      });
    } finally {
      setSavingPackageId(null);
    }
  };

  const disableRow = async (row: EditableTatPricingRow) => {
    if (!row.overrideId) {
      updateRow(row.packageId, {
        customPriceInput: "",
      });
      return;
    }

    setSavingPackageId(row.packageId);
    setFeedback(null);

    try {
      await axiosInstance.delete(`/admin/client-tat-pricing/${row.overrideId}`);
      updateRow(row.packageId, {
        overrideId: row.overrideId,
        isOverridden: false,
        overridePrice: null,
        overrideActive: false,
        effectivePrice: row.defaultPrice,
        customPriceInput: "",
      });
      setFeedback({
        type: "success",
        text: `Disabled override for ${row.displayLabel}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, `Unable to disable ${row.displayLabel}.`),
      });
    } finally {
      setSavingPackageId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            Client TAT Custom Pricing
          </h2>
          <p className="mt-1 text-sm text-dark-5">
            Select a client and enter only the custom TAT prices you want to override. Any TAT left blank will keep using the default price automatically.
          </p>
        </div>

        {feedback && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="max-w-xl">
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Client
          </label>
          <select
            value={selectedUsername}
            onChange={(event) => setSelectedUsername(event.target.value)}
            disabled={loadingClients}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
          >
            <option value="">Select client</option>
            {clients.map((client) => {
              const value = client.username || client.email || "";
              return (
                <option key={client.id} value={value}>
                  {getClientLabel(client)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          TAT Pricing Matrix
        </h3>

        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead>TAT</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Default Price</TableHead>
              <TableHead>Effective Price</TableHead>
              <TableHead>Custom Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.packageId} className="border-[#eee] dark:border-dark-3">
                <TableCell>{row.displayLabel}</TableCell>
                <TableCell>{row.packageCode}</TableCell>
                <TableCell>${Number(row.defaultPrice ?? 0).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={row.isOverridden ? "font-semibold text-primary" : ""}>
                    ${Number(row.effectivePrice ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.customPriceInput}
                    onChange={(event) =>
                      updateRow(row.packageId, {
                        customPriceInput: event.target.value,
                      })
                    }
                    className="w-28 rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void saveRow(row)}
                      disabled={savingPackageId === row.packageId || !selectedUsername}
                      className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                    >
                      {savingPackageId === row.packageId ? "Saving..." : "Save Price"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void disableRow(row)}
                      disabled={savingPackageId === row.packageId}
                      className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark dark:border-dark-3 dark:text-white"
                    >
                      Reset Default
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!loadingRows && selectedUsername && rows.length === 0 && (
          <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
            No active TAT packages found.
          </p>
        )}
      </div>
    </div>
  );
}
