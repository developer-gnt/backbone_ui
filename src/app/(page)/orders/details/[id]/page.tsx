"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { getAttachmentUrl as getDownloadHref } from "@/lib/attachmentUrl";

type AttachmentRow = {
  id: number | string;
  type?: string;
  filename?: string;
  filepath?: string;
};

type MessageRow = {
  order_id?: number | string;
  message?: string;
  msg_frm?: string;
  name?: string;
  email?: string | null;
  msg_time?: string;
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
    standard_instruction?: string;
    description?: string;
    sketch?: string;
    reply?: string;
    remark?: string;
  };
  downloads: AttachmentRow[];
  completedDownloads: AttachmentRow[];
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [details, setDetails] = useState<OrderDetailResponse | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = `${params?.id ?? ""}`.trim();

    if (!orderId) {
      setError("Invalid order id.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [detailRes, messageRes] = await Promise.all([
          axiosInstance.get(`/masters/reports/orders/${orderId}/details`),
          axiosInstance.get(`/masters/orders/${orderId}/messages`),
        ]);

        setDetails(detailRes.data ?? null);
        setMessages(Array.isArray(messageRes.data?.messages) ? messageRes.data.messages : []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load order details."));
        setDetails(null);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <p className="text-sm text-dark-5">Loading order details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "No order details found."}
        </div>
      </div>
    );
  }

  const { order } = details;
  const isTeamMember = (user?.role ?? "").toLowerCase() === "team member";

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Overview</p>
            <h2 className="text-xl font-semibold text-dark dark:text-white">Order Details</h2>
          </div>
          <div className="flex gap-2">
            <Link
              href="/orders/assigned-orders"
              className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
            >
              Back to Assigned Orders
            </Link>
            <Link
              href="/chat-system"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Chat Here
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Order Details</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><span className="text-sm text-dark-5">File #</span><p className="font-medium text-dark dark:text-white">{order.id}</p></div>
          <div><span className="text-sm text-dark-5">Form Type</span><p className="font-medium text-dark dark:text-white">{order.order_type || "-"}</p></div>
          <div><span className="text-sm text-dark-5">REO Form</span><p className="font-medium text-dark dark:text-white">{order.reoform || "-"}</p></div>
          <div><span className="text-sm text-dark-5">NON UAD</span><p className="font-medium text-dark dark:text-white">{order.non_uad || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Transaction</span><p className="font-medium text-dark dark:text-white">{order.financing || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Sketch</span><p className="font-medium text-dark dark:text-white">{order.sketch || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Borrower Name</span><p className="font-medium text-dark dark:text-white">{order.borrower_name || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Status</span><p className="font-medium text-dark dark:text-white">{order.status || "-"}</p></div>
          {!isTeamMember && <div><span className="text-sm text-dark-5">Supervisor</span><p className="font-medium text-dark dark:text-white">{order.supervisor_name || "-"}</p></div>}
          <div><span className="text-sm text-dark-5">Assigned Team Member</span><p className="font-medium text-dark dark:text-white">{order.team_member_name || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Client Username</span><p className="font-medium text-dark dark:text-white">{order.createdby || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Created</span><p className="font-medium text-dark dark:text-white">{formatDateTime(order.created_date)}</p></div>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Property Information</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2"><span className="text-sm text-dark-5">Address</span><p className="font-medium text-dark dark:text-white">{order.subject_address || "-"}</p></div>
          <div><span className="text-sm text-dark-5">State</span><p className="font-medium text-dark dark:text-white">{order.subject_state || "-"}</p></div>
          <div><span className="text-sm text-dark-5">City</span><p className="font-medium text-dark dark:text-white">{order.subject_city || "-"}</p></div>
          <div><span className="text-sm text-dark-5">Zipcode</span><p className="font-medium text-dark dark:text-white">{order.subject_zipcode || "-"}</p></div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-lg bg-gray-1 p-4 dark:bg-dark-2">
            <div className="mb-2 text-sm font-medium text-dark dark:text-white">Order Instructions</div>
            <div className="whitespace-pre-wrap text-sm text-dark-5">{order.description || "-"}</div>
          </div>
          <div className="rounded-lg bg-gray-1 p-4 dark:bg-dark-2">
            <div className="mb-2 text-sm font-medium text-dark dark:text-white">Standard Instructions</div>
            <div className="whitespace-pre-wrap text-sm text-dark-5">{order.standard_instruction || "-"}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">All Attachments</h3>
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-green-700">Submitted Documents For File #{order.id}</p>
            <div className="space-y-2">
              {details.downloads.length ? details.downloads.map((item) => {
                const href = getDownloadHref(item.filepath);
                return (
                  <div key={`working-${item.id}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                    <div className="font-medium text-dark dark:text-white">{item.type || "Document"}</div>
                    <div className="text-sm text-dark-5">{item.filename || "Unnamed file"}</div>
                    {href && (
                      <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary">
                        Download
                      </a>
                    )}
                  </div>
                );
              }) : <p className="text-sm text-dark-5">No submitted documents found.</p>}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-green-700">Completed Report For File #{order.id}</p>
            <div className="space-y-2">
              {details.completedDownloads.length ? details.completedDownloads.map((item) => {
                const href = getDownloadHref(item.filepath);
                return (
                  <div key={`completed-${item.id}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                    <div className="font-medium text-dark dark:text-white">{item.type || "Completed Report"}</div>
                    <div className="text-sm text-dark-5">{item.filename || "Unnamed file"}</div>
                    {href && (
                      <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary">
                        Download
                      </a>
                    )}
                  </div>
                );
              }) : <p className="text-sm text-dark-5">No completed report files found.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-dark dark:text-white">History</h3>
          <Link href="/chat-system" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Chat Here
          </Link>
        </div>

        <div className="space-y-3">
          {messages.length ? (
            messages.map((item, index) => (
              <div key={`${item.order_id}-${index}`} className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                <div className="text-sm font-medium text-dark dark:text-white">
                  {item.msg_frm === "client" ? item.name || "Client" : "Backbone Data Solutions"}
                </div>
                <div className="text-xs text-dark-5">{formatDateTime(item.msg_time)}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-dark-5">{item.message || "-"}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-dark-5">No chat history found for this order.</p>
          )}
        </div>
      </div>
    </div>
  );
}
