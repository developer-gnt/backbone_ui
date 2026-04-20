"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { package: string; msg: string }, packageName?: string) => void;
  editData?: {
    package: string;
    msg: string;
  } | null;
}

export default function AlertAvailabilityModal({
  open,
  onClose,
  onSubmit,
  editData,
}: AlertModalProps) {
  const [packageName, setPackageName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editData) {
      setPackageName(editData.package || "");
      setMessage(editData.msg || "");
    } else {
      setPackageName("");
      setMessage("");
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Availability" : "Add Availability"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="Package"
            type="text"
            placeholder="Enter package code or name"
            value={packageName}
            handleChange={(e) => setPackageName(e.target.value)}
          />

          <InputGroup
            label="Message"
            type="text"
            placeholder="Enter availability message"
            value={message}
            handleChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-stroke px-4 py-2 text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSubmit(
                {
                  package: packageName.trim(),
                  msg: message.trim(),
                },
                editData?.package,
              )
            }
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
