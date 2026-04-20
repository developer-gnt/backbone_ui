"use client";

import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import React, { useState } from "react";

export default function BulkEmailPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      setFeedback({
        type: "error",
        text: "Subject and message are required.",
      });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const response = await axiosInstance.post("/notification/mass-email", {
        subject: subject.trim(),
        message: message.trim(),
        recipientIds: [],
        sendToAllClients: true,
      });

      window.alert("Emails Send Successfully");
      setFeedback({
        type: "success",
        text: response.data?.message || "Emails Send Successfully",
      });
      setSubject("");
      setMessage("");
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to send mass email."),
      });
    } finally {
      setIsSending(false);
    }
  };

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

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
          <label className="pt-2 text-sm font-medium text-dark dark:text-white">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
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
            className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
          <div />
          <div>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending}
              className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
