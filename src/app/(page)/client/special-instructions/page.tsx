"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { updateCurrentUserProfile } from "@/components/Auth/authService";
import { getApiErrorMessage } from "@/lib/axiosInstance";

export default function ClientSpecialInstructionsPage() {
  const { user, refreshUser } = useAuth();
  const [instructions, setInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setInstructions(user?.std_instr ?? "");
  }, [user?.std_instr]);

  const handleSave = async () => {
    if (!user?.id) {
      setFeedback({ type: "error", text: "Unable to identify the signed-in client." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateCurrentUserProfile(user.id, { std_instr: instructions.trim() });
      await refreshUser();
      setFeedback({
        type: "success",
        text: "Your special instructions have been saved for future orders.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to save special instructions."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Add Special Instructions
        </h1>
        <p className="mt-2 text-sm text-dark-5">
          These notes will be reused for your future orders and help the team follow your standard preferences.
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

      <div className="space-y-4">
        <label className="block text-sm font-medium text-dark dark:text-white">
          Special Instructions
        </label>
        <textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={10}
          placeholder="Write any standing instructions here..."
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Instructions"}
        </button>
      </div>
    </div>
  );
}
