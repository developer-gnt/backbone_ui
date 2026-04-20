"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      registration_id?: number;
      amount: number;
      credits: number;
      transaction_id?: string;
      status?: string;
      mode?: string;
    },
    id?: number,
  ) => void;
  editData?: {
    id: number;
    amount: number | string;
    credits: number | string;
    transaction_id?: string;
    status?: string;
    mode?: string;
  } | null;
}

export default function TransactionModal({
  open,
  onClose,
  onSubmit,
  editData,
}: TransactionModalProps) {
  const [registrationId, setRegistrationId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [credits, setCredits] = useState<number>(0);
  const [transactionId, setTransactionId] = useState("");
  const [status, setStatus] = useState("Pending");
  const [mode, setMode] = useState("Credit");

  useEffect(() => {
    if (editData) {
      setRegistrationId(0);
      setAmount(Number(editData.amount || 0));
      setCredits(Number(editData.credits || 0));
      setTransactionId(editData.transaction_id || "0");
      setStatus(editData.status || "Pending");
      setMode(editData.mode || "Credit");
    } else {
      setRegistrationId(0);
      setAmount(0);
      setCredits(0);
      setTransactionId("0");
      setStatus("Pending");
      setMode("Credit");
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
          {!editData && (
            <InputGroup
              label="Registration ID"
              type="number"
              placeholder="Enter registration id"
              value={String(registrationId || "")}
              handleChange={(e) => setRegistrationId(Number(e.target.value))}
            />
          )}

          <InputGroup
            label="Amount"
            type="number"
            placeholder="Enter transaction amount"
            value={String(amount)}
            handleChange={(e) => setAmount(Number(e.target.value))}
          />

          <InputGroup
            label="Credits"
            type="number"
            placeholder="Enter credits"
            value={String(credits)}
            handleChange={(e) => setCredits(Number(e.target.value))}
          />

          <InputGroup
            label="Transaction ID"
            type="text"
            placeholder="Enter gateway/reference id"
            value={transactionId}
            handleChange={(e) => setTransactionId(e.target.value)}
          />

          <InputGroup
            label="Status"
            type="text"
            placeholder="Pending / Approved / Success"
            value={status}
            handleChange={(e) => setStatus(e.target.value)}
          />

          <InputGroup
            label="Mode"
            type="text"
            placeholder="Credit / Debit"
            value={mode}
            handleChange={(e) => setMode(e.target.value)}
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
                  registration_id: editData ? undefined : registrationId,
                  amount,
                  credits,
                  transaction_id: transactionId.trim(),
                  status: status.trim(),
                  mode: mode.trim(),
                },
                editData?.id,
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
