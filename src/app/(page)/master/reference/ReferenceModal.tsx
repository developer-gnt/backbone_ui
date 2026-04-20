"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface ReferenceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (referenceSource: string, id?: number) => void;
  editData?: { id: number; reference_source: string } | null;
}

export default function ReferenceModal({
  open,
  onClose,
  onSubmit,
  editData,
}: ReferenceModalProps) {
  const [referenceSource, setReferenceSource] = useState("");

  useEffect(() => {
    if (editData) {
      setReferenceSource(editData.reference_source || "");
    } else {
      setReferenceSource("");
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Reference" : "Add Reference"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="Reference Source"
            type="text"
            placeholder="Enter reference source"
            value={referenceSource}
            handleChange={(e) => setReferenceSource(e.target.value)}
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
            onClick={() => onSubmit(referenceSource.trim(), editData?.id)}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update Reference" : "Add Reference"}
          </button>
        </div>
      </div>
    </div>
  );
}
