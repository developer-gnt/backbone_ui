"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface CreditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; credit: number }, id?: string) => void;
  editData?: { id: string; name: string; credit: number } | null;
}

export default function CreditModal({
  open,
  onClose,
  onSubmit,
  editData,
}: CreditModalProps) {
  const [name, setName] = useState("");
  const [credit, setCredit] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCredit(editData.credit);
    } else {
      setName("");
      setCredit(0);
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">

        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Credit" : "Add Credit"}
        </h3>

        <div className="space-y-4">

          <InputGroup
            label="Name"
            type="text"
            placeholder="Enter name"
            value={name}
            handleChange={(e) => setName(e.target.value)}
          />

          <InputGroup
            label="Credit"
            type="number"
            placeholder="Enter credit value"
            value={String(credit)}   // 🔥 FIX: convert number → string
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
            onClick={() => onSubmit({ name, credit }, editData?.id)}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update Credit" : "Add Credit"}
          </button>
        </div>

      </div>
    </div>
  );
}
