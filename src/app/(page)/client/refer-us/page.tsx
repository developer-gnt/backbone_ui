"use client";

import React, { useState } from "react";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
};

export default function ReferUsPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (key: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await axiosInstance.post("/notification/referral", form);
      setFeedback({
        type: "success",
        text:
          response.data?.message ||
          "Thank you for your referral. The Backbone team will contact them shortly.",
      });
      setForm(initialForm);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to submit your referral."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Add Referral</h1>
        <p className="mt-2 text-sm text-dark-5">
          Share your referral details and the team will follow up with them.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              First Name
            </label>
            <input
              value={form.firstName}
              onChange={(event) => handleChange("firstName", event.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              placeholder="e.g. Shawn"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Last Name
            </label>
            <input
              value={form.lastName}
              onChange={(event) => handleChange("lastName", event.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              placeholder="e.g. Smith"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="e.g. referral@example.com"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Mobile Number
          </label>
          <input
            value={form.mobile}
            onChange={(event) => handleChange("mobile", event.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="e.g. 9984938639"
            required
          />
        </div>

        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
