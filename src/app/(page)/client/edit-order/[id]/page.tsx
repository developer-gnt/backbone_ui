"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { getAttachmentUrl as getAttachmentLink } from "@/lib/attachmentUrl";

const DOCUMENT_TYPES = [
  "Standard template of form 1004, 1073, 2055, 1025",
  "Order page / Engagement letter / Client order form",
  "Sales Contract",
  "1004 Market Condition",
  "Inspection Sheet / Field Notes",
  "Rough Sketch",
  "Subject County and MLS",
  "Comps County and MLS",
  "Subject and Comps Photos",
  "Plat Map",
];

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
    status?: string;
    order_type?: string;
    financing?: string;
    reoform?: string;
    non_uad?: string;
    borrower_name?: string;
    subject_address?: string;
    subject_state?: string;
    subject_city?: string;
    subject_zipcode?: string;
    subject_country?: string;
    order_type_comment?: string;
    description?: string;
    standard_instruction?: string;
    sketch?: string;
  };
  downloads: AttachmentRow[];
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
  reoform: string;
  nonUad: string;
  packageId: string;
};

const initialForm: FormState = {
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
  reoform: "No",
  nonUad: "No",
  packageId: "",
};

const getDurationValue = (item?: TatPackageOption) => {
  const raw = `${item?.tatHours ?? item?.packageCode ?? item?.displayLabel ?? ""}`;
  const match = raw.match(/\d+/);
  return match ? match[0].padStart(2, "0") : `${item?.packageId ?? ""}`;
};

const getPackageCost = (item?: TatPackageOption) =>
  Number(item?.effectivePrice ?? item?.defaultPrice ?? 0);
const getPackageTitle = (item?: TatPackageOption) => {
  const duration = getDurationValue(item);
  return item?.displayLabel?.trim() || `${Number(duration)} hours TAT`;
};
const getEtaLabel = (item?: TatPackageOption, index = 0) => {
  const duration = getDurationValue(item);
  const displayDuration =
    ETA_ORDER.find((value) => value === duration) ??
    ETA_ORDER[index] ??
    duration;
  return `${displayDuration} hours TAT`;
};
const ETA_ORDER = ["12", "06", "04"] as const;
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

export default function ClientEditOrderPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [packages, setPackages] = useState<TatPackageOption[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>([]);
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [downloads, setDownloads] = useState<AttachmentRow[]>([]);
  const [attachmentsByType, setAttachmentsByType] = useState<Record<string, File[]>>({});
  const [duplicateInfo, setDuplicateInfo] = useState<{ exists: boolean; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const orderId = `${params?.id ?? ""}`.trim();

  const etaPackages = useMemo(() => getEtaPackages(packages), [packages]);

  useEffect(() => {
    if (!orderId) {
      setFeedback({ type: "error", text: "Invalid order id." });
      setLoading(false);
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      setFeedback(null);

      try {
        const [detailRes, packageRes, orderTypeRes, formRes, stateRes] = await Promise.all([
          axiosInstance.get(`/masters/reports/orders/${orderId}/details`),
          axiosInstance.get("/tat-packages", {
            params: { username: user?.username || user?.email || undefined },
          }),
          axiosInstance.get("/masters/order-type"),
          axiosInstance.get("/masters/forms"),
          axiosInstance.get("/masters/state"),
        ]);

        const detail = detailRes.data as OrderDetailResponse;
        const nextPackages = Array.isArray(packageRes.data) ? packageRes.data : [];
        const nextOrderTypes = Array.isArray(orderTypeRes.data) ? orderTypeRes.data : [];
        const nextFinancing = Array.isArray(formRes.data) ? formRes.data : [];
        const nextStates = Array.isArray(stateRes.data) ? stateRes.data : [];
        const preferredEtaPackages = getEtaPackages(nextPackages);

        const order = detail?.order;
        const matchedPackage = preferredEtaPackages.find((item: TatPackageOption) => {
          const packageValue = `${order?.package ?? ""}`.trim();
          return (
            `${item.packageId}` === packageValue ||
            getDurationValue(item) === packageValue.padStart(2, "0") ||
            `${item.displayLabel ?? item.packageCode ?? ""}`.includes(packageValue)
          );
        });

        setPackages(nextPackages);
        setOrderTypes(nextOrderTypes);
        setFinancingOptions(nextFinancing);
        setStates(nextStates);
        setDownloads(Array.isArray(detail?.downloads) ? detail.downloads : []);

        setForm({
          orderType: order?.order_type ?? `${nextOrderTypes[0]?.order_type ?? ""}`,
          financing: order?.financing ?? `${nextFinancing[0]?.form ?? ""}`,
          subjectAddress: order?.subject_address ?? "",
          state: order?.subject_state ?? `${nextStates[0]?.city ?? ""}`,
          city: order?.subject_city ?? "",
          zipcode: order?.subject_zipcode ?? "",
          country: order?.subject_country ?? "United States",
          borrowerName: order?.borrower_name ?? "",
          orderTypeComment: order?.order_type_comment ?? "",
          instructions: order?.description ?? "",
          standardInstruction: order?.standard_instruction ?? user?.std_instr ?? "",
          sketch: order?.sketch ?? "YES",
          reoform: order?.reoform ?? "No",
          nonUad: order?.non_uad ?? "No",
          packageId: `${matchedPackage?.packageId ?? preferredEtaPackages[0]?.packageId ?? ""}`,
        });
      } catch (error) {
        setFeedback({
          type: "error",
          text: getApiErrorMessage(error, "Unable to load this order for editing."),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPageData();
  }, [orderId, user?.email, user?.std_instr, user?.username]);

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

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateFiles = (label: string, fileList: FileList | null) => {
    setAttachmentsByType((prev) => ({
      ...prev,
      [label]: Array.from(fileList ?? []),
    }));
  };

  const removeAttachment = async (downloadId: number | string) => {
    const confirmed = window.confirm("Are you sure you want to delete this document?");

    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(`/masters/orders/downloads/${downloadId}`);
      setDownloads((prev) => prev.filter((item) => `${item.id}` !== `${downloadId}`));
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to delete the selected document."),
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPackage) {
      setFeedback({ type: "error", text: "Estimated ETA is required." });
      return;
    }

    if (!form.subjectAddress.trim()) {
      setFeedback({ type: "error", text: "Street address is required." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = new FormData();
      payload.append("createdby", user?.username || user?.email || "");
      payload.append("package", getDurationValue(selectedPackage));
      payload.append("package_id", `${selectedPackage.packageId ?? ""}`);
      payload.append("tat_package_id", `${selectedPackage.packageId ?? ""}`);
      payload.append("package_code", `${selectedPackage.packageCode ?? ""}`);
      payload.append("tat_hours", getDurationValue(selectedPackage));
      payload.append("charged_amount", `${getPackageCost(selectedPackage)}`);
      payload.append("amount", `${getPackageCost(selectedPackage)}`);
      payload.append("order_type", form.orderType);
      payload.append("financing", form.financing);
      payload.append("reoform", form.reoform);
      payload.append("non_uad", form.nonUad);
      payload.append("borrower_name", form.borrowerName.trim());
      payload.append("subject_address", form.subjectAddress.trim());
      payload.append("subject_state", form.state.trim());
      payload.append("subject_city", form.city.trim());
      payload.append("subject_zipcode", form.zipcode.trim());
      payload.append("subject_country", form.country.trim());
      payload.append("order_type_comment", form.orderTypeComment.trim());
      payload.append("description", form.instructions.trim());
      payload.append("standard_instruction", form.standardInstruction.trim());
      payload.append("sketch", form.sketch);
      payload.append("message", form.instructions.trim());

      Object.entries(attachmentsByType).forEach(([label, files]) => {
        files.forEach((file) => {
          payload.append("attachments", file);
          payload.append("attachmentTypes", label);
        });
      });

      await axiosInstance.patch(`/masters/orders/${orderId}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFeedback({
        type: "success",
        text: "Your Order has been successfully updated and received by us!",
      });
      setAttachmentsByType({});
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Failed To Proceed Order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <p className="text-sm text-dark-5">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Change In Order</p>
            <h1 className="text-2xl font-semibold text-dark dark:text-white">File # {orderId}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/orders/details/${orderId}`} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white">
              View Details
            </Link>
            <Link href="/reports/order-reports" className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Subject Assignment & Property Information</h3>

            {duplicateInfo?.exists && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4">
                This subject address is already exist in the portal. Please reconfirm before placing duplicate order. Thanks!
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Form Type</label>
                <select value={form.orderType} onChange={(e) => updateField("orderType", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                  {orderTypes.map((item) => (
                    <option key={item.id} value={item.order_type || ""}>{item.order_type || "—"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Transaction</label>
                <select value={form.financing} onChange={(e) => updateField("financing", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                  {financingOptions.map((item) => (
                    <option key={item.id} value={item.form || ""}>{item.form || "—"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Borrower Name</label>
                <input value={form.borrowerName} onChange={(e) => updateField("borrowerName", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Address</label>
                <input value={form.subjectAddress} onChange={(e) => updateField("subjectAddress", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">State</label>
                <select value={form.state} onChange={(e) => updateField("state", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                  {states.map((item, index) => (
                    <option key={`${item.id ?? index}-${item.city ?? ""}`} value={item.city || ""}>{item.city || "—"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">City</label>
                <input value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Zip Code</label>
                <input value={form.zipcode} onChange={(e) => updateField("zipcode", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Country</label>
                <input value={form.country} onChange={(e) => updateField("country", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">REO Form</label>
                <select value={form.reoform} onChange={(e) => updateField("reoform", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">NON UAD</label>
                <select value={form.nonUad} onChange={(e) => updateField("nonUad", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Clients Instructions</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Instruction For This Order</label>
                <textarea value={form.instructions} onChange={(e) => updateField("instructions", e.target.value)} rows={4} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Special Instructions</label>
                <textarea value={form.standardInstruction} onChange={(e) => updateField("standardInstruction", e.target.value)} rows={4} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Order Type Comment</label>
                <input value={form.orderTypeComment} onChange={(e) => updateField("orderTypeComment", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Estimated ETA</label>
                  <select value={form.packageId} onChange={(e) => updateField("packageId", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                    {etaPackages.map((item, index) => (
                      <option key={item.packageId} value={item.packageId}>{getEtaLabel(item, index)} - ${getPackageCost(item)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Make Sketch</label>
                  <select value={form.sketch} onChange={(e) => updateField("sketch", e.target.value)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white">
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Required Documents For Completion of Assignment</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {DOCUMENT_TYPES.map((label) => (
                <div key={label}>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{label}</label>
                  <input type="file" multiple onChange={(e) => updateFiles(label, e.target.files)} className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {submitting ? "Saving..." : "Submit Assignment"}
            </button>
          </div>
        </div>

        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Assignment Attachments Provided By You</h3>
          <div className="space-y-3">
            {downloads.length ? downloads.map((item) => {
              const href = getAttachmentLink(item.filepath);
              return (
                <div key={item.id} className="rounded-lg border border-stroke p-3 dark:border-dark-3">
                  <div className="font-medium text-dark dark:text-white">{item.filename || "Unnamed file"}</div>
                  <div className="text-xs text-dark-5">{item.type || "Attachment"}</div>
                  <div className="mt-2 flex gap-3">
                    {href && (
                      <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">Open</a>
                    )}
                    <button type="button" onClick={() => void removeAttachment(item.id)} className="text-sm font-medium text-red-600 underline">
                      Delete
                    </button>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-dark-5">No files found here!</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
