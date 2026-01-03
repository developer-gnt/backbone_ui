"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { name: string; credit_core: number; amount: number },
    id?: string
  ) => void;
  editData?: { id: string; name: string; credit_core: number; amount: number } | null;
}

export default function TransactionModal({
  open,
  onClose,
  onSubmit,
  editData,
}: TransactionModalProps) {
  const [name, setName] = useState("");
  const [creditCore, setCreditCore] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCreditCore(editData.credit_core);
      setAmount(Number(editData.amount));
    } else {
      setName("");
      setCreditCore(0);
      setAmount(0);
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">

        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Transaction" : "Add Transaction"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="Name"
            type="text"
            placeholder="Enter transaction name"
            value={name}
            handleChange={(e) => setName(e.target.value)}
          />

          <InputGroup
            label="Credit Core"
            type="number"
            placeholder="Enter credit core"
            value={String(creditCore)}     // FIX
            handleChange={(e) => setCreditCore(Number(e.target.value))}
          />

          <InputGroup
            label="Amount"
            type="number"
            placeholder="Enter transaction amount"
            value={String(amount)}         // FIX
            handleChange={(e) => setAmount(Number(e.target.value))}
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
                  name,
                  credit_core: creditCore,
                  amount,
                },
                editData?.id
              )
            }
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update Transaction" : "Add Transaction"}
          </button>
        </div>

      </div>
    </div>
  );
}
