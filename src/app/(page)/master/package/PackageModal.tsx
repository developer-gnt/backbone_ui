"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface PackageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { title: string; duration: string; price: number; credit: number },
    id?: number,
  ) => void;
  editData?: {
    id: number;
    title: string;
    duration?: string;
    price: number | string;
    credit: number | string;
  } | null;
}

export default function PackageModal({
  open,
  onClose,
  onSubmit,
  editData,
}: PackageModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [credit, setCredit] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDuration(editData.duration || "");
      setPrice(Number(editData.price || 0));
      setCredit(Number(editData.credit || 0));
    } else {
      setTitle("");
      setDuration("");
      setPrice(0);
      setCredit(0);
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Package" : "Add Package"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="Package Title"
            type="text"
            placeholder="Enter package title"
            value={title}
            handleChange={(e) => setTitle(e.target.value)}
          />

          <InputGroup
            label="Duration"
            type="text"
            placeholder='Example: "$1.00/ Credit" or "30 days"'
            value={duration}
            handleChange={(e) => setDuration(e.target.value)}
          />

          <InputGroup
            label="Price"
            type="number"
            placeholder="Enter price"
            value={String(price)}
            handleChange={(e) => setPrice(Number(e.target.value))}
          />

          <InputGroup
            label="Credits"
            type="number"
            placeholder="Enter included credits"
            value={String(credit)}
            handleChange={(e) => setCredit(Number(e.target.value))}
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
              onSubmit({ title: title.trim(), duration: duration.trim(), price, credit }, editData?.id)
            }
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update Package" : "Add Package"}
          </button>
        </div>
      </div>
    </div>
  );
}
