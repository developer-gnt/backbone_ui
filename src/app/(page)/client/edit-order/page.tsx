"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

// type PackageOption = {
//   id: number | string;
//   title?: string;
//   duration?: string;
//   price?: number | string;
//   credit?: number | string;
//   basePrice?: number | string;
//   baseCredit?: number | string;
//   customPrice?: number | string | null;
//   customCredit?: number | string | null;
//   isCustomPricing?: boolean;
//   pricingNotes?: string | null;
// };

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
    subject_country?: string;
    order_type_comment?: string;
    standard_instruction?: string;
    description?: string;
    sketch?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

type FormState = {
  orderType: string;
  financing: string;
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

const AVAILABILITY_COLORS = [
  "text-green-600",
  "text-blue-600",
  "text-red-600",
] as const;

const ETA_ORDER = ["12", "06", "04"] as const;

const getDurationValue = (item?: TatPackageOption) => {
  const raw = `${item?.tatHours ?? item?.packageCode ?? item?.displayLabel ?? ""}`;
  const match = raw.match(/\d+/);

  return match ? match[0].padStart(2, "0") : `${item?.packageId ?? ""}`;
};

const getPackageCost = (item?: TatPackageOption) =>
  Number(item?.effectivePrice ?? item?.defaultPrice ?? 0);

const getPackageTitle = (item?: TatPackageOption) =>
  item?.displayLabel?.trim() || `${Number(getDurationValue(item))} hours TAT`;

const getEtaLabel = (item?: TatPackageOption, index = 0) => {
  const duration = getDurationValue(item);

  const displayDuration =
    ETA_ORDER.find((v) => v === duration) ?? ETA_ORDER[index] ?? duration;

  return `${displayDuration} hours TAT`;
};

const getEtaPackages = (packages: TatPackageOption[]) => {
  const preferred = ETA_ORDER.map((duration) =>
    packages.find((item) => getDurationValue(item) === duration),
  ).filter((item): item is TatPackageOption => Boolean(item));

  if (
    preferred.length >= ETA_ORDER.length ||
    packages.length <= ETA_ORDER.length
  ) {
    return preferred.length ? preferred : packages.slice(0, ETA_ORDER.length);
  }

  const selectedIds = new Set(preferred.map((item) => `${item.packageId}`));

  const fallback = packages
    .filter((item) => !selectedIds.has(`${item.packageId}`))
    .slice(0, ETA_ORDER.length - preferred.length);

  return [...preferred, ...fallback];
};

export default function EditOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const oid = searchParams.get("oid");

  const [form, setForm] = useState<FormState>({
    orderType: "",
    financing: "",
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
  });

  const [packages, setPackages] = useState<TatPackageOption[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>([]);
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>(
    [],
  );
  const [states, setStates] = useState<StateOption[]>([]);
  const [files, setFiles] = useState<AttachmentRow[]>([]);
  const [filesByType, setFilesByType] = useState<Record<string, File[]>>({});
  const [availabilityRows, setAvailabilityRows] = useState<
    Array<{
      package?: string;
      msg?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const etaPackages = useMemo(() => getEtaPackages(packages), [packages]);

  const etaAvailabilityRows = useMemo(
    () =>
      ETA_ORDER.map((duration, index) => {
        const matchedRow =
          availabilityRows.find((row) =>
            `${row.package ?? ""}`.includes(duration),
          ) ?? availabilityRows[index];

        return {
          key: `${duration}-${index}`,
          text: matchedRow?.msg?.trim() || "Available",
          color: AVAILABILITY_COLORS[index] ?? "text-dark dark:text-white",
        };
      }),
    [availabilityRows],
  );

  const selectedPackage = useMemo(
    () =>
      etaPackages.find((item) => `${item.packageId}` === form.packageId) ||
      etaPackages[0],
    [form.packageId, etaPackages],
  );

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateFiles = (label: string, fileList: FileList | null) => {
    setFilesByType((prev) => ({
      ...prev,
      [label]: Array.from(fileList ?? []),
    }));
  };

  // Load master data and order details
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!oid) {
          setFeedback({
            type: "error",
            text: "Invalid order ID. Please try again.",
          });
          setTimeout(() => router.push("/client/orders"), 2000);
          return;
        }

        setLoading(true);

        const [
          availabilityRes,
          packageRes,
          orderTypeRes,
          formRes,
          stateRes,
          orderDetailsRes,
        ] = await Promise.all([
          axiosInstance.get("/masters/alert-availability"),
          axiosInstance.get("/tat-packages"),
          axiosInstance.get("/masters/order-type"),
          axiosInstance.get("/masters/forms"),
          axiosInstance.get("/masters/state"),
          axiosInstance.get(`/masters/reports/orders/${oid}/details`),
        ]);

        const nextPackages = Array.isArray(packageRes.data)
          ? packageRes.data
          : [];
        const nextOrderTypes = Array.isArray(orderTypeRes.data)
          ? orderTypeRes.data
          : [];
        const nextForms = Array.isArray(formRes.data) ? formRes.data : [];
        const nextStates = Array.isArray(stateRes.data) ? stateRes.data : [];
        const orderDetails: OrderDetailResponse = orderDetailsRes.data;

        setPackages(nextPackages);
        setOrderTypes(nextOrderTypes);
        setFinancingOptions(nextForms);
        setStates(nextStates);
        setAvailabilityRows(
          Array.isArray(availabilityRes.data) ? availabilityRes.data : [],
        );
        setFiles(orderDetails.downloads || []);

        const order = orderDetails.order;
        let packageId = form.packageId;

        // Map TAT to package ID
        if (order.tat) {
          const tatValue = order.tat.replace(/\D/g, "").padStart(2, "0");
          const matchedPackage = nextPackages.find(
            (p) => getDurationValue(p) === tatValue,
          );
          if (matchedPackage) {
            packageId = `${matchedPackage.packageId}`;
          }
        }

        setForm({
          orderType: order.order_type || "",
          financing: order.financing || "",
          subjectAddress: order.subject_address || "",
          state: order.subject_state || "",
          city: order.subject_city || "",
          zipcode: order.subject_zipcode || "",
          country: order.subject_country || "United States",
          borrowerName: order.borrower_name || "",
          orderTypeComment: order.order_type_comment || "",
          instructions: order.description || "",
          standardInstruction: order.standard_instruction || "",
          sketch: order.sketch || "YES",
          reoform: (order.reoform || "").toLowerCase() === "yes",
          nonUad: (order.non_uad || "").toLowerCase() === "yes",
          packageId,
        });
      } catch (error) {
        setFeedback({
          type: "error",
          text: getApiErrorMessage(
            error,
            "Failed to load order details. Please try again.",
          ),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [oid, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.subjectAddress.trim()) {
      setFeedback({
        type: "error",
        text: "Subject address is required.",
      });
      return;
    }

    if (!selectedPackage) {
      setFeedback({
        type: "error",
        text: "Estimated ETA is required.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("order_type", form.orderType);
      payload.append("financing", form.financing);
      payload.append("reoform", form.reoform ? "Yes" : "No");
      payload.append("non_uad", form.nonUad ? "Yes" : "No");
      payload.append("borrower_name", form.borrowerName.trim());
      payload.append("subject_address", form.subjectAddress.trim());
      payload.append("subject_state", form.state);
      payload.append("subject_city", form.city.trim());
      payload.append("subject_zipcode", form.zipcode.trim());
      payload.append("subject_country", form.country.trim());
      payload.append("order_type_comment", form.orderTypeComment.trim());
      payload.append("description", form.instructions.trim());
      payload.append("standard_instruction", form.standardInstruction.trim());
      payload.append("sketch", form.sketch);
      payload.append("package", getDurationValue(selectedPackage));

      // Add new files
      Object.entries(filesByType).forEach(([label, uploadedFiles]) => {
        uploadedFiles.forEach((file) => {
          payload.append("attachments", file);
          payload.append("attachmentTypes", label);
        });
      });

      await axiosInstance.patch(`/masters/orders/${oid}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFeedback({
        type: "success",
        text: "Your order has been successfully updated!",
      });

      // Redirect to order reports after success
      setTimeout(() => {
        router.push("/reports/order-reports");
      }, 2000);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(
          error,
          "Failed to update the order. Please try again.",
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-[10px] border border-stroke bg-white p-10 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="text-dark dark:text-white">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6">
        <div className="text-sm text-dark-5">Editing</div>
        <h2 className="text-2xl font-semibold text-dark dark:text-white">
          Change In Order: {oid}
        </h2>
      </div>

      {feedback && (
        <div
          className={`mb-5 rounded-md px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Subject & Property Information */}
        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Subject Assignment & Property Information
          </div>

          <div className="space-y-5 p-4">
            {/* Form Type */}
            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-start">
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
                      value={item.order_type}
                      checked={form.orderType === item.order_type}
                      onChange={(e) => updateField("orderType", e.target.value)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    {item.order_type}
                  </label>
                ))}
              </div>
            </div>

            {/* Order Type Comment */}
            {form.orderType === "Other" && (
              <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
                <label className="text-sm font-medium text-dark dark:text-white">
                  Comment for Order Type
                </label>
                <input
                  type="text"
                  value={form.orderTypeComment}
                  onChange={(e) =>
                    updateField("orderTypeComment", e.target.value)
                  }
                  placeholder="Write comment for order type"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            )}

            {/* Financing */}
            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)] md:items-start">
              <label className="pt-2 text-sm font-medium text-dark dark:text-white">
                Transaction
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
                      value={item.form}
                      checked={form.financing === item.form}
                      onChange={(e) => updateField("financing", e.target.value)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    {item.form}
                  </label>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
              <label className="text-sm font-medium text-dark dark:text-white">
                Street Address *
              </label>
              <input
                type="text"
                value={form.subjectAddress}
                onChange={(e) => updateField("subjectAddress", e.target.value)}
                placeholder="29 S. Pine St."
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                required
              />
            </div>

            {/* State, City, Zip */}
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  State
                </label>
                <select
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value="">Select State</option>
                  {states.map((item) => (
                    <option key={item.id} value={item.city}>
                      {item.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Houston"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={form.zipcode}
                  onChange={(e) => updateField("zipcode", e.target.value)}
                  placeholder="098201"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            {/* Country & Borrower Name */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Country
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="United States Of America"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Borrower Name
                </label>
                <input
                  type="text"
                  value={form.borrowerName}
                  onChange={(e) => updateField("borrowerName", e.target.value)}
                  placeholder="Eg. Kelly"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            {/* REO Form & Non-UAD */}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 text-sm text-dark dark:text-white">
                <input
                  type="checkbox"
                  checked={form.reoform}
                  onChange={(e) => updateField("reoform", e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
                REO Form
              </label>

              <label className="flex items-center gap-3 text-sm text-dark dark:text-white">
                <input
                  type="checkbox"
                  checked={form.nonUad}
                  onChange={(e) => updateField("nonUad", e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
                NON UAD
              </label>
            </div>
          </div>
        </div>

        {/* Upload Documents */}
        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Required Documents For Completion of Assignment
          </div>

          <div className="space-y-4 p-4">
            {UPLOAD_FIELDS.map((field) => (
              <div
                key={field.key}
                className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]"
              >
                <label className="text-sm font-medium text-dark dark:text-white">
                  {field.label}
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => updateFiles(field.key, e.target.files)}
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Existing Attachments */}
        {files.length > 0 && (
          <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
            <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
              Existing Attachments
            </div>

            <div className="p-4">
              <div className="max-h-64 space-y-2 overflow-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-dark"
                  >
                    <span className="text-sm text-dark dark:text-white">
                      {file.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Client Instructions */}
        <div className="overflow-hidden rounded-md border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke bg-white px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            Client Instructions
          </div>

          <div className="space-y-5 p-4">
            {/* Instructions for this Order */}
            <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
              <label className="text-sm font-medium text-dark dark:text-white">
                Instructions for this Order
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => updateField("instructions", e.target.value)}
                rows={4}
                placeholder="e.g. your default font, MLS pages link, Client/Lender Name..."
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            {/* Standard Instructions */}
            <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
              <label className="text-sm font-medium text-dark dark:text-white">
                Special Instructions
              </label>
              <textarea
                value={form.standardInstruction}
                onChange={(e) =>
                  updateField("standardInstruction", e.target.value)
                }
                rows={4}
                placeholder="Software version, font size, county assessor's website, or anything we should do..."
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            {/* Sketch */}
            <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)] md:items-start">
              <label className="pt-2 text-sm font-medium text-dark dark:text-white">
                Make Sketch
              </label>
              <div className="flex gap-5 rounded-md border border-stroke px-3 py-2 dark:border-dark-3">
                {["YES", "NO"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 text-sm text-dark dark:text-white"
                  >
                    <input
                      type="radio"
                      name="sketch"
                      value={option}
                      checked={form.sketch === option}
                      onChange={(e) => updateField("sketch", e.target.value)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Estimated ETA */}
            <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
              <label className="text-sm font-medium text-dark dark:text-white">
                Estimated ETA (Hours) *
              </label>
              <div className="flex flex-wrap gap-3 rounded-md border border-stroke px-3 py-2 dark:border-dark-3">
                {etaPackages.map((item) => (
                  <label
                    key={item.packageId}
                    className="flex items-center gap-2 text-sm text-dark dark:text-white"
                  >
                    <input
                      type="radio"
                      name="package"
                      value={`${item.packageId}`}
                      checked={`${form.packageId}` === `${item.packageId}`}
                      onChange={(e) => updateField("packageId", e.target.value)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    {getPackageTitle(item)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 border-t border-stroke pt-5 dark:border-dark-3">
          <button
            type="submit"
            disabled={submitting}
            className="ml-auto inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Submit Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
