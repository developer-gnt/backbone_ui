"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { eta: string; availability_status: string },
    id?: string
  ) => void;
  editData?: {
    id: string;
    eta: string;
    availability_status: string;
  } | null;
}

export default function AlertAvailabilityModal({
  open,
  onClose,
  onSubmit,
  editData,
}: AlertModalProps) {
  const [eta, setEta] = useState("");
  const [status, setStatus] = useState("");

  // Convert timestamp to yyyy-MM-ddTHH:mm format
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (editData) {
      setEta(formatDateTime(editData.eta));
      setStatus(editData.availability_status);
    } else {
      setEta("");
      setStatus("");
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">

        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Alert Availability" : "Add Alert Availability"}
        </h3>

        <div className="space-y-4">

          {/* ETA Date-Time Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
              ETA
            </label>
            <input
              type="datetime-local"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className="w-full rounded-lg border border-stroke p-3 focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <InputGroup
            label="Availability Status"
            type="text"
            placeholder="Enter availability status"
            value={status}
            handleChange={(e) => setStatus(e.target.value)}
          />

        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-stroke px-4 py-2 text-dark hover:bg-gray-2 
              dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSubmit(
                {
                  eta,
                  availability_status: status,
                },
                editData?.id
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
