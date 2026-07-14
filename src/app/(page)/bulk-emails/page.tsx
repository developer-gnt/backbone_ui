"use client";

import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import React, { useState, useEffect } from "react";

interface Client {
  id: number;
  firstname?: string;
  lastname?: string;
  companyname?: string;
  email?: string;
}

export default function BulkEmailPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.firstname?.toLowerCase().includes(query) ||
      client.lastname?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.companyname?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const response = await axiosInstance.get("/user/clients", {
          params: { pageSize: 10000 },
          signal: controller.signal,
        });
        setClients(response.data || []);
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error("Failed to fetch clients", error);
          setFeedback({
            type: "error",
            text: "Unable to load clients. Please try again.",
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingClients(false);
        }
      }
    };
    fetchClients();

    return () => controller.abort();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClientIds(clients.map((c) => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleSelectClient = (id: number) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };


  const handleSendEmail = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setFeedback({
        type: "error",
        text: "Subject and message are required.",
      });
      return;
    }

    if (selectedClientIds.length === 0) {
      setFeedback({
        type: "error",
        text: "Please select at least one client.",
      });
      return;
    }

    const confirmed = window.confirm(
      `This action cannot be undone.\n\nSend this email to ${selectedClientIds.length} recipient${
        selectedClientIds.length === 1 ? "" : "s"
      }?`
    );

    if (!confirmed) return;

    setIsSending(true);
    setFeedback(null);

    try {
      const sendToAllClients = selectedClientIds.length === clients.length;
      await axiosInstance.post("/notification/mass-email", {
        subject: trimmedSubject,
        message: trimmedMessage,
        recipientIds: selectedClientIds,
        sendToAllClients,
      });

      setFeedback({
        type: "success",
        text: `Email sent successfully to ${selectedClientIds.length} recipient${
          selectedClientIds.length === 1 ? "" : "s"
        }.`,
      });
      setSubject("");
      setMessage("");
      setSelectedClientIds([]);

      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to send mass email."),
      });
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid =
    Boolean(subject.trim()) &&
    Boolean(message.trim()) &&
    selectedClientIds.length > 0;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-dark dark:text-white">
          Compose New Email
        </h2>
      </div>

      {feedback && (
        <div
          className={`mb-6 rounded-md px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
            <label className="pt-2 text-sm font-medium text-dark dark:text-white">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
            <label className="pt-2 text-sm font-medium text-dark dark:text-white">
              Message
            </label>
            <textarea
              rows={15}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your email message..."
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
            <div />
            <div>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || !isFormValid}
                className="rounded-md bg-primary flex items-center justify-center px-5 py-2.5 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex h-full max-h-[600px] flex-col rounded-xl border border-stroke bg-gray-2 p-5 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Select Recipients
            </h3>

            {/* Search Input */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-stroke bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
            </div>

            {isLoadingClients ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center rounded-lg bg-white p-3 shadow-sm dark:bg-dark-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={
                      filteredClients.length > 0 &&
                      filteredClients.every((c) =>
                        selectedClientIds.includes(c.id)
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = new Set(selectedClientIds);
                        filteredClients.forEach((c) => newIds.add(c.id));
                        setSelectedClientIds(Array.from(newIds));
                      } else {
                        const filteredIds = new Set(
                          filteredClients.map((c) => c.id)
                        );
                        setSelectedClientIds(
                          selectedClientIds.filter((id) => !filteredIds.has(id))
                        );
                      }
                    }}
                    className="mr-3 h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3"
                  />
                  <label
                    htmlFor="selectAll"
                    className="flex-1 cursor-pointer select-none text-sm font-semibold text-dark dark:text-white"
                  >
                    Select All ({selectedClientIds.length}/{clients.length})
                  </label>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {filteredClients.map((client) => (
                    <label
                      key={client.id}
                      htmlFor={`client-${client.id}`}
                      className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                        selectedClientIds.includes(client.id)
                          ? "border-primary bg-primary/5 dark:border-primary/50 dark:bg-primary/10"
                          : "border-stroke bg-white hover:border-primary/50 dark:border-dark-3 dark:bg-dark-3"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`client-${client.id}`}
                        checked={selectedClientIds.includes(client.id)}
                        onChange={() => handleSelectClient(client.id)}
                        className="mr-3 h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3"
                      />

                      <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                        {(client.firstname || client.companyname || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <span className="block truncate text-sm font-medium text-dark dark:text-white">
                          {client.firstname} {client.lastname}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {client.email}
                        </span>
                        {client.companyname && (
                          <span className="block truncate text-xs text-gray-400">
                            {client.companyname}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      No clients found.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
