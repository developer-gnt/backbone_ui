"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

export default function ClientFeedbackFormPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const id = searchParams.get("id") || searchParams.get("order") || "";
    const urlRating = searchParams.get("rating");

    if (id) {
      setOrderId(id);
    }
    if (urlRating) {
      setRating(urlRating);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orderId.trim()) {
      setMessage({ type: "error", text: "File # is required." });
      return;
    }

    if (!feedback.trim() && !rating) {
      setMessage({
        type: "error",
        text: "Please provide feedback or a rating.",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await axiosInstance.patch(`/masters/orders/${orderId.trim()}/feedback`, {
        feedback: feedback.trim(),
        feedback_rating: rating,
      });

      setFeedback("");
      setMessage({
        type: "success",
        text:
          response.data?.message || "Thanx for providing your valuable feedback",
      });
      
      // Redirect to dashboard with a hard refresh to get latest data
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(
          error,
          "The feedback can't submitted as this is not completed order",
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Send Feedback</h1>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">File #</label>
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Feedback</label>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={6}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Rating</label>
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Needs work</option>
            <option value="1">1 - Poor</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send Feedback"}
        </button>
      </form>
    </div>
  );
}
