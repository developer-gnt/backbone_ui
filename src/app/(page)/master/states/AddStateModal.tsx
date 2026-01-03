"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface AddStateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, id?: string) => void;
  editData?: { id: string; name: string } | null;
}

export default function AddStateModal({ open, onClose, onSubmit, editData }: AddStateModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
    } else {
      setName("");
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
        
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit State" : "Add New State"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="State Name"
            type="text"
            value={name}
            handleChange={(e) => setName(e.target.value)}
            placeholder="Enter state name"
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
            onClick={() => onSubmit(name, editData?.id)}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
