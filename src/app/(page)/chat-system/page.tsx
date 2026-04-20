"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type ChatRow = {
  order_id: number | string;
  message: string;
  msg_frm?: string;
  name?: string;
  msg_time?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB");
};

export default function ChatSystemPage() {
  const searchParams = useSearchParams();
  const [fileNumber, setFileNumber] = useState("");
  const [activeFileNumber, setActiveFileNumber] = useState("");
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    const requestedId = `${searchParams.get("id") ?? ""}`.trim();

    if (requestedId) {
      setFileNumber(requestedId);
      setActiveFileNumber(requestedId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeFileNumber.trim()) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setFeedback(null);
      setLoadingMessages(true);

      try {
        const response = await axiosInstance.get(
          `/masters/orders/${activeFileNumber.trim()}/messages`,
        );
        const history = Array.isArray(response.data?.messages)
          ? response.data.messages
          : [];

        setMessages(history);

        if (history.length === 0) {
          setFeedback({
            type: "info",
            text: "Message not found for this order",
          });
        }
      } catch (error) {
        setMessages([]);
        setFeedback({
          type: "error",
          text: getApiErrorMessage(
            error,
            "Unable to load chat history for this order.",
          ),
        });
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [activeFileNumber]);

  const applyFileNumber = () => {
    setActiveFileNumber(fileNumber.trim());
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    const targetFile = fileNumber.trim();

    if (!targetFile) {
      setFeedback({ type: "error", text: "Please enter File #" });
      return;
    }

    setActiveFileNumber(targetFile);

    if (!reply.trim()) {
      setFeedback({ type: "error", text: "Please enter Reply" });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const response = await axiosInstance.post(
        `/masters/orders/${targetFile}/messages`,
        { message: reply.trim() },
      );

      window.alert("Message send successfully");
      setFeedback({
        type: "success",
        text: response.data?.message || "Message send successfully",
      });
      setReply("");

      const history = await axiosInstance.get(
        `/masters/orders/${targetFile}/messages`,
      );
      setMessages(Array.isArray(history.data?.messages) ? history.data.messages : []);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to send the message."),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
      <div className="mb-6">
        <div className="text-sm text-dark-5">Overview</div>
        <h2 className="text-2xl font-semibold text-dark dark:text-white">
          Chat System <small className="text-base font-normal text-dark-5">Sending message</small>
        </h2>
      </div>

      {feedback && (
        <div
          className={`mb-5 rounded-md px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-100 text-green-700"
              : feedback.type === "info"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSend}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                File #
              </label>
              <input
                type="text"
                value={fileNumber}
                onChange={(event) => setFileNumber(event.target.value)}
                onBlur={applyFileNumber}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyFileNumber();
                  }
                }}
                placeholder="Enter File #"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Reply
              </label>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={7}
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="h-[200px] overflow-y-auto rounded-md border border-black/30 bg-white p-3 dark:border-dark-3 dark:bg-dark-2">
              {loadingMessages ? (
                <div className="text-sm text-dark-5">Loading messages...</div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    const isClient =
                      (message.msg_frm || "client").toLowerCase() === "client";

                    return (
                      <div key={`${message.order_id}-${index}-${message.msg_time}`}>
                        <div
                          className={`text-sm font-medium ${
                            isClient
                              ? "text-red-600"
                              : "text-black dark:text-white"
                          }`}
                        >
                          {isClient
                            ? `${message.name || "Client"} (${formatDate(message.msg_time)}):`
                            : `Backbone Data Solutions (${formatDate(message.msg_time)}):`}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-dark dark:text-white">
                          {message.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-dark-5">Message not found for this order</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSending}
            className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}
