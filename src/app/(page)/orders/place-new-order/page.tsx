"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { LocationIQResult, searchAddress } from "@/lib/locationiq";

type TatPackageOption = {
  packageId: number | string;
  packageCode?: string;
  displayLabel?: string;
  tatHours?: number | string;
  defaultPrice?: number | string;
  effectivePrice?: number | string;
  isOverridden?: boolean;
  overrideId?: number | null;
};

type OrderTypeOption = {
  id: number | string;
  order_type?: string;
};

type FinancingOption = {
  id: number | string;
  form?: string;
};

type StateOption = {
  id?: number | string;
  city?: string;
};

type ClientLookup = {
  id?: number | string;
  username?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  std_instr?: string;
  wallete_balance?: number | string;
};

type FormState = {
  clientUsername: string;
  orderType: string;
  financing: string;
  fullAddress: string;
  subjectAddress: string;
  state: string;
  city: string;
  zipcode: string;
  country: string;
  borrowerName: string;
  orderTypeComment: string;
  instructions: string;
  standardInstruction: string;
  sketch: string;
  reoform: boolean;
  nonUad: boolean;
  packageId: string;
};

const UPLOAD_FIELDS = [
  {
    key: "template",
    label: "Template Total *.zap File",
  },
  {
    key: "public-record",
    label: "Public Record File",
  },
  {
    key: "market-conditions",
    label: "Market Conditions File",
  },
  {
    key: "mls-file",
    label: "MLS File",
  },
  {
    key: "field-inspections",
    label: "Field Inspections",
  },
  {
    key: "standard-instructions",
    label: "Standard Instruction Files",
  },
] as const;

const AVAILABILITY_COLORS = ["text-green-600", "text-blue-600", "text-red-600"] as const;
const ETA_ORDER = ["12", "06", "04"] as const;

const getEtaPackages = (packages: TatPackageOption[]) => {
  const preferred = ETA_ORDER.map((duration) =>
    packages.find((item) => getDurationValue(item) === duration),
  ).filter((item): item is TatPackageOption => Boolean(item));

  if (preferred.length >= ETA_ORDER.length || packages.length <= ETA_ORDER.length) {
    return preferred.length ? preferred : packages.slice(0, ETA_ORDER.length);
  }

  const selectedIds = new Set(preferred.map((item) => `${item.packageId}`));
  const fallback = packages
    .filter((item) => !selectedIds.has(`${item.packageId}`))
    .slice(0, ETA_ORDER.length - preferred.length);

  return [...preferred, ...fallback];
};

const initialForm: FormState = {
  clientUsername: "",
  orderType: "",
  financing: "",
  fullAddress: "",
  subjectAddress: "",
  state: "",
  city: "",
  zipcode: "",
  country: "United States",
  borrowerName: "",
  orderTypeComment: "",
  instructions: "",
  standardInstruction: "",
  sketch: "YES",
  reoform: false,
  nonUad: false,
  packageId: "",
};

const getDurationValue = (item?: TatPackageOption) => {
  const raw = `${item?.tatHours ?? item?.packageCode ?? item?.displayLabel ?? ""}`;
  const match = raw.match(/\d+/);
  return match ? match[0].padStart(2, "0") : `${item?.packageId ?? ""}`;
};

const getPackageCost = (item?: TatPackageOption) => Number(item?.effectivePrice ?? item?.defaultPrice ?? 0);
const getPackageTitle = (item?: TatPackageOption) => item?.displayLabel?.trim() || `${Number(getDurationValue(item))} hours TAT`;
const getEtaLabel = (item?: TatPackageOption, index = 0) => {
  const duration = getDurationValue(item);
  const displayDuration = ETA_ORDER.find((value) => value === duration) ?? ETA_ORDER[index] ?? duration;
  return `${displayDuration} hours TAT`;
};

export default function PlaceNewOrderPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [packages, setPackages] = useState<TatPackageOption[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>([]);
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientLookup | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{ exists: boolean; count: number } | null>(null);
  const [filesByType, setFilesByType] = useState<Record<string, File[]>>({});
  const [extraUploadSlots, setExtraUploadSlots] = useState<number[]>([0]);
  const [availabilityRows, setAvailabilityRows] = useState<
    Array<{ package?: string; msg?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const etaPackages = useMemo(() => getEtaPackages(packages), [packages]);

  const [suggestions, setSuggestions] = useState<LocationIQResult[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (form.fullAddress.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingAddress(true);

        const results = await searchAddress(form.fullAddress);

        setSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAddress(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [form.fullAddress]);






  const etaAvailabilityRows = useMemo(
    () =>
      ETA_ORDER.map((duration, index) => {
        const matchedRow =
          availabilityRows.find((row) => `${row.package ?? ""}`.includes(duration)) ??
          availabilityRows[index];

        return {
          key: `${duration}-${index}`,
          text: matchedRow?.msg?.trim() || "Available",
          color: AVAILABILITY_COLORS[index] ?? "text-dark dark:text-white",
        };
      }),
    [availabilityRows],
  );

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);

      try {
        const [packageRes, orderTypeRes, formRes, stateRes, availabilityRes] =
          await Promise.all([
            axiosInstance.get("/tat-packages"),
            axiosInstance.get("/masters/order-type"),
            axiosInstance.get("/masters/forms"),
            axiosInstance.get("/masters/state"),
            axiosInstance.get("/masters/alert-availability"),
          ]);

        const nextPackages = Array.isArray(packageRes.data) ? packageRes.data : [];
        const nextOrderTypes = Array.isArray(orderTypeRes.data) ? orderTypeRes.data : [];
        const nextForms = Array.isArray(formRes.data) ? formRes.data : [];
        const nextStates = Array.isArray(stateRes.data) ? stateRes.data : [];
        const nextAvailability = Array.isArray(availabilityRes.data)
          ? availabilityRes.data
          : [];

        const preferredEtaPackages = getEtaPackages(nextPackages);
        const defaultEtaPackage = preferredEtaPackages[0];

        setPackages(nextPackages);
        setOrderTypes(nextOrderTypes);
        setFinancingOptions(nextForms);
        setStates(nextStates);
        setAvailabilityRows(nextAvailability);
        setForm((prev) => ({
          ...prev,
          packageId: prev.packageId || `${defaultEtaPackage?.packageId ?? ""}`,
          orderType: prev.orderType || `${nextOrderTypes[0]?.order_type ?? "1004"}`,
          financing: prev.financing || `${nextForms[0]?.form ?? "CONVENTIONAL"}`,
          state: prev.state || `${nextStates[0]?.city ?? ""}`,
        }));
      } catch (error) {
        setFeedback({
          type: "error",
          text: getApiErrorMessage(error, "Unable to load the new order page."),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPageData();
  }, []);


  useEffect(() => {
    const username =
      user?.role === "Client"
        ? user.username?.trim() || ""
        : form.clientUsername.trim();

    if (!username) {
      setClientInfo(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await axiosInstance.get(`/user/${encodeURIComponent(username)}`);
        const nextClient = response.data ?? null;
        setClientInfo(nextClient);

        setForm((prev) => ({
          ...prev,
          clientUsername:
            prev.clientUsername || user?.username || nextClient?.username || "",
          standardInstruction:
            prev.standardInstruction || `${nextClient?.std_instr ?? ""}`,
        }));
      } catch {
        setClientInfo(null);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [form.clientUsername]);

  useEffect(() => {
    const pricingUsername = clientInfo?.username || clientInfo?.email;

    const loadClientPackages = async () => {
      try {
        const response = await axiosInstance.get("/tat-packages", {
          params: pricingUsername
            ? {
              username: pricingUsername,
            }
            : undefined,
        });
        const nextPackages = Array.isArray(response.data) ? response.data : [];

        if (!nextPackages.length) {
          return;
        }

        const preferredEtaPackages = getEtaPackages(nextPackages);

        setPackages(nextPackages);
        setForm((prev) => ({
          ...prev,
          packageId: preferredEtaPackages.some((item) => `${item.packageId}` === prev.packageId)
            ? prev.packageId
            : `${preferredEtaPackages[0]?.packageId ?? ""}`,
        }));
      } catch {
        // Keep the default package list if the client-specific pricing lookup fails.
      }
    };

    void loadClientPackages();
  }, [clientInfo?.username, clientInfo?.email]);

  useEffect(() => {
    const address = form.subjectAddress.trim();

    if (address.length < 6) {
      setDuplicateInfo(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await axiosInstance.get("/masters/orders/check-duplicate-address", {
          params: { address },
        });
        setDuplicateInfo(response.data ?? { exists: false, count: 0 });
      } catch {
        setDuplicateInfo(null);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [form.subjectAddress]);

  const selectedPackage = useMemo(
    () => etaPackages.find((item) => `${item.packageId}` === form.packageId) ?? etaPackages[0],
    [form.packageId, etaPackages],
  );

  const selectedPackageCost = getPackageCost(selectedPackage);
  const clientWallet = Number(clientInfo?.wallete_balance ?? 0);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAddress = (item: LocationIQResult) => {
    updateField("fullAddress", item.display_name);

    updateField(
      "subjectAddress",
      `${item.address.house_number ?? ""} ${item.address.road ?? ""}`.trim()
    );

    updateField(
      "city",
      item.address.city ??
      item.address.town ??
      item.address.village ??
      ""
    );

    updateField("state", item.address.state ?? "");

    updateField("zipcode", item.address.postcode ?? "");

    updateField("country", item.address.country ?? "");

    setSuggestions([]);
  };

  const updateFiles = (label: string, fileList: FileList | null) => {
    setFilesByType((prev) => ({
      ...prev,
      [label]: Array.from(fileList ?? []),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const subjectAddress = form.subjectAddress.trim() || form.fullAddress.trim();

    if (!form.clientUsername.trim()) {
      setFeedback({ type: "error", text: "Client username is required." });
      return;
    }

    if (!clientInfo) {
      setFeedback({
        type: "error",
        text: "Please enter a valid client username before submitting.",
      });
      return;
    }

    if (!selectedPackage) {
      setFeedback({ type: "error", text: "Estimated ETA is required." });
      return;
    }

    if (!subjectAddress) {
      setFeedback({ type: "error", text: "Street address is required." });
      return;
    }

    if (selectedPackageCost > clientWallet) {
      setFeedback({
        type: "error",
        text: "The selected client does not have enough wallet balance to proceed with this order.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("createdby", form.clientUsername.trim());
      payload.append("package", selectedPackage?.packageCode || getDurationValue(selectedPackage));
      payload.append("tat_package_id", `${selectedPackage?.packageId ?? ""}`);
      payload.append("package_code", selectedPackage?.packageCode || getDurationValue(selectedPackage));
      payload.append("tat_hours", `${selectedPackage?.tatHours ?? getDurationValue(selectedPackage)}`);
      payload.append("charged_amount", `${selectedPackageCost}`);
      payload.append("amount", `${selectedPackageCost}`);
      payload.append("status", "New Order");
      payload.append("order_type", form.orderType);
      payload.append("financing", form.financing);
      payload.append("reoform", form.reoform ? "Yes" : "No");
      payload.append("non_uad", form.nonUad ? "Yes" : "No");
      payload.append("borrower_name", form.borrowerName.trim());
      payload.append("subject_address", subjectAddress);
      payload.append("subject_state", form.state);
      payload.append("subject_city", form.city.trim());
      payload.append("subject_zipcode", form.zipcode.trim());
      payload.append("subject_country", form.country.trim());
      payload.append("order_type_comment", form.orderTypeComment.trim());
      payload.append("description", form.instructions.trim());
      payload.append("standard_instruction", form.standardInstruction.trim());
      payload.append("sketch", form.sketch);
      payload.append("message", form.instructions.trim());

      Object.entries(filesByType).forEach(([label, files]) => {
        files.forEach((file) => {
          payload.append("attachments", file);
          payload.append("attachmentTypes", label);
        });
      });

      const response = await axiosInstance.post("/masters/orders", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFilesByType({});
      setExtraUploadSlots([0]);
      setDuplicateInfo(null);
      setClientInfo((prev) =>
        prev
          ? {
            ...prev,
            wallete_balance:
              response.data?.wallete_balance ?? prev.wallete_balance ?? 0,
          }
          : prev,
      );
      setForm((prev) => ({
        ...initialForm,
        clientUsername: prev.clientUsername,
        orderType: prev.orderType,
        financing: prev.financing,
        state: prev.state,
        packageId: `${selectedPackage.packageId}`,
        standardInstruction: prev.standardInstruction,
      }));

      window.alert("Your Order has been successfully placed!");
      setFeedback({
        type: "success",
        text: "Your Order has been successfully placed!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Failed to place the new order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6">
        <div className="text-sm text-dark-5">Overview</div>
        <h2 className="text-2xl font-semibold text-dark dark:text-white">
          Request A New Writing Order
        </h2>
      </div>

      {feedback && (
        <div
          className={`mb-5 rounded-md px-4 py-3 text-sm ${feedback.type === "success"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {feedback.text}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Assignment Information
          </div>

          <div className="space-y-5 p-4">
            <div className="grid items-center gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
              <label className="text-sm font-medium text-dark dark:text-white">
                User Name
              </label>
              <input
                value={form.clientUsername}
                onChange={(event) => updateField("clientUsername", event.target.value)}
                placeholder="Eg. ron1992"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                required
              />
            </div>

            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)_minmax(0,280px)] md:items-start">
              <label className="pt-2 text-sm font-medium text-dark dark:text-white">
                Form Type
              </label>
              <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-stroke px-3 py-2 dark:border-dark-3">
                {orderTypes.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-sm text-dark dark:text-white"
                  >
                    <input
                      type="radio"
                      name="orderType"
                      checked={form.orderType === (item.order_type || "")}
                      onChange={() => updateField("orderType", item.order_type || "")}
                    />
                    {item.order_type || "Order Type"}
                  </label>
                ))}
              </div>

              <input
                value={form.orderTypeComment}
                onChange={(event) => updateField("orderTypeComment", event.target.value)}
                placeholder="Write Comment For Order Type"
                style={{ display: form.orderType === "Other" ? "block" : "none" }}
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)_170px] md:items-start">
              <div className="flex items-center gap-3 text-sm text-dark dark:text-white">
                <label className="font-medium">REO Form</label>
                <input
                  type="checkbox"
                  checked={form.reoform}
                  onChange={(event) => updateField("reoform", event.target.checked)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Transaction :
                </label>
                <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-stroke px-3 py-2 dark:border-dark-3">
                  {financingOptions.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 text-sm text-dark dark:text-white"
                    >
                      <input
                        type="radio"
                        name="financing"
                        checked={form.financing === (item.form || "")}
                        onChange={() => updateField("financing", item.form || "")}
                      />
                      {item.form || "Form"}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-dark dark:text-white">
                <label className="font-medium">NON UAD</label>
                <input
                  type="checkbox"
                  checked={form.nonUad}
                  onChange={(event) => updateField("nonUad", event.target.checked)}
                />
              </div>
            </div>

            <div className="grid items-center gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
              <label className="text-sm font-medium text-dark dark:text-white">
                Borrower Name
              </label>
              <input
                value={form.borrowerName}
                onChange={(event) => updateField("borrowerName", event.target.value)}
                placeholder="BORROWER NAME"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Property Information
          </div>

          <div className="space-y-5 p-4">
            {duplicateInfo?.exists && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This subject address is already exist in the portal.Please reconfirm before placing duplicate order.Thanks!!
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                *Address
              </label>

              <div className="relative">
                <input
                  value={form.fullAddress}
                  onChange={(e) =>
                    updateField("fullAddress", e.target.value)
                  }
                  placeholder="e.g. 1234 Main St"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm"
                />

                {loadingAddress && (
                  <div className="mt-2 text-sm">
                    Searching...
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                    {suggestions.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectAddress(item)}
                        className="block w-full border-b px-4 py-3 text-left hover:bg-gray-100"
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* <input
                value={form.fullAddress}
                onChange={(event) => updateField("fullAddress", event.target.value)}
                placeholder="e.g. 1234 Main St"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              /> */}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  *Street Address
                </label>
                <input
                  value={form.subjectAddress}
                  onChange={(event) => updateField("subjectAddress", event.target.value)}
                  onBlur={() => {
                    if (!form.subjectAddress.trim() && form.fullAddress.trim()) {
                      updateField("subjectAddress", form.fullAddress.trim());
                    }
                  }}
                  placeholder="e.g. 1234 Main St"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  State
                </label>
                <select
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  {states.map((item, index) => (
                    <option key={`${item.id ?? item.city ?? index}`} value={item.city || ""}>
                      {item.city || "State"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="e.g. Washington"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Zip Code
                </label>
                <input
                  value={form.zipcode}
                  onChange={(event) => updateField("zipcode", event.target.value)}
                  placeholder="e.g. 04574"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Country
                </label>
                <input
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="e.g. United States"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Upload Working Docs
          </div>

          <div className="space-y-5 p-4">
            <div className="grid gap-5 md:grid-cols-2">
              {UPLOAD_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-dark dark:text-white">
                    {field.label}
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(event) => updateFiles(field.label, event.target.files)}
                    className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white">
                  More Files or .zip
                </label>
                <p className="mt-1 text-xs text-dark-5">
                  You can upload more files if needed or rather than uploading single file you can upload .zip file of all type of file.
                </p>
              </div>

              <div className="space-y-2">
                {extraUploadSlots.map((slot, index) => (
                  <div key={slot} className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      onChange={(event) =>
                        updateFiles(`More Files or .zip ${slot}`, event.target.files)
                      }
                      className="min-w-[220px] flex-1 rounded-md border border-stroke bg-transparent px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />

                    {index === extraUploadSlots.length - 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExtraUploadSlots((prev) => [...prev, (prev.at(-1) ?? 0) + 1])
                        }
                        className="rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90"
                      >
                        Add More
                      </button>
                    )}

                    {extraUploadSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExtraUploadSlots((prev) => prev.filter((item) => item !== slot))
                        }
                        className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Client Instructions
          </div>

          <div className="space-y-5 p-4">
            <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
              <div>
                <label className="text-sm font-medium text-dark dark:text-white">
                  Make Sketch [ <small>Rough Sketch Provided</small> ]
                </label>
              </div>
              <div className="flex flex-wrap gap-6">
                {["YES", "NO"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 text-sm text-dark dark:text-white"
                  >
                    <input
                      type="radio"
                      name="sketch"
                      checked={form.sketch === option}
                      onChange={() => updateField("sketch", option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
              <div>
                <label className="text-sm font-medium text-dark dark:text-white">
                  Instruction For This Order
                </label>
                <p className="mt-1 text-xs text-dark-5">
                  e.g. your default font, MLS pages link, Client/Lender Name, Borrower Name, any comp or subject data missing.
                </p>
              </div>
              <textarea
                value={form.instructions}
                onChange={(event) => updateField("instructions", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
              <div>
                <label className="text-sm font-medium text-dark dark:text-white">
                  Standard Instruction For All Order
                </label>
                <p className="mt-1 text-xs text-dark-5">
                  These instructions should not changed very often. These will be used every-time we do the data entry for all of your reports.
                </p>
              </div>
              <textarea
                value={form.standardInstruction}
                onChange={(event) => updateField("standardInstruction", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_220px_minmax(0,1fr)] md:items-start">
              <div>
                <label className="flex flex-wrap items-center gap-1 text-sm font-medium text-dark dark:text-white">
                  <span>*Estimated ETA</span>
                  <span
                    title="Estimated Time of Arrival"
                    className="inline-flex items-center"
                  >
                    <img
                      style={{ width: 20 }}
                      alt=""
                      src="https://secure.ieimpact.com/impact-assets/img/help.svg"
                    />
                  </span>
                  <span className="text-xs font-normal text-dark-5">[ <small>Hours</small> ]</span>
                </label>
              </div>

              <div>
                <table className="text-sm text-dark dark:text-white">
                  <tbody>
                    {etaPackages.map((item, index) => (
                      <tr key={item.packageId}>
                        <td className="py-1 pr-2 align-top">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="packageId"
                              checked={`${item.packageId}` === form.packageId}
                              onChange={() => updateField("packageId", `${item.packageId}`)}
                            />
                            <span>{getEtaLabel(item, index)}</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <table className="text-sm">
                  <tbody>
                    {etaAvailabilityRows.map((row) => (
                      <tr key={row.key}>
                        <td className={`py-1 ${row.color}`}>{row.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading || submitting}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "SUBMIT"}
          </button>
        </div>
      </form>
    </div>
  );
}
