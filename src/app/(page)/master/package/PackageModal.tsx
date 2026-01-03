"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface PackageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { title: string; duration: number; price: number },
    id?: string
  ) => void;
  editData?: { id: string; title: string; duration: number; price: number } | null;
}

export default function PackageModal({
  open,
  onClose,
  onSubmit,
  editData,
}: PackageModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setDuration(editData.duration);
      setPrice(Number(editData.price));
    } else {
      setTitle("");
      setDuration(0);
      setPrice(0);
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
            label="Duration (Days)"
            type="number"
            placeholder="Enter duration"
            value={String(duration)}          // 🔥 FIX
            handleChange={(e) => setDuration(Number(e.target.value))}
          />

          <InputGroup
            label="Price"
            type="number"
            placeholder="Enter price"
            value={String(price)}             // 🔥 FIX
            handleChange={(e) => setPrice(Number(e.target.value))}
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
            onClick={() => onSubmit({ title, duration, price }, editData?.id)}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update Package" : "Add Package"}
          </button>
        </div>

      </div>
    </div>
  );
}
