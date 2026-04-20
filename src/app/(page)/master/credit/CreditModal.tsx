"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface CreditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      registration_id?: number;
      username?: string;
      credits: number;
      remarks?: string;
      points?: number;
      status?: string;
    },
    id?: number,
  ) => void;
  editData?: {
    id: number;
    username: string | null;
    wallete_balance: number | string | null;
    points?: number | string | null;
    status?: string | null;
  } | null;
}

export default function CreditModal({
  open,
  onClose,
  onSubmit,
  editData,
}: CreditModalProps) {
  const [registrationId, setRegistrationId] = useState<number>(0);
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editData) {
      setRegistrationId(editData.id);
      setUsername(editData.username || "");
      setAmount(Number(editData.wallete_balance || 0));
      setPoints(Number(editData.points || 0));
      setNotes(editData.status || "Active");
    } else {
      setRegistrationId(0);
      setUsername("");
      setAmount(0);
      setPoints(0);
      setNotes("");
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Adjust Wallet" : "Add Bonus Credit"}
        </h3>

        <div className="space-y-4">
          {editData ? (
            <InputGroup
              label="Registration ID"
              type="number"
              placeholder="Enter registration id"
              value={String(registrationId || "")}
              handleChange={(e) => setRegistrationId(Number(e.target.value))}
              disabled
            />
          ) : (
            <InputGroup
              label="User Name"
              type="text"
              placeholder="Enter client user name or email"
              value={username}
              handleChange={(e) => setUsername(e.target.value)}
            />
          )}

          <InputGroup
            label={editData ? "Wallet Balance" : "Credits to Add"}
            type="number"
            placeholder={editData ? "Enter wallet balance" : "Enter bonus credits"}
            value={String(amount)}
            handleChange={(e) => setAmount(Number(e.target.value))}
          />

          {editData && (
            <InputGroup
              label="Points"
              type="number"
              placeholder="Enter points balance"
              value={String(points)}
              handleChange={(e) => setPoints(Number(e.target.value))}
            />
          )}

          <InputGroup
            label={editData ? "Status" : "Remarks"}
            type="text"
            placeholder={editData ? "Active / Hold / Terminated" : "Manual bonus by admin"}
            value={notes}
            handleChange={(e) => setNotes(e.target.value)}
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
            onClick={() => {
              if (!editData && !username.trim()) {
                alert("Please enter the client user name or email.");
                return;
              }

              if (!Number.isFinite(amount) || amount < 0) {
                alert("Please enter a valid credit amount.");
                return;
              }

              onSubmit(
                {
                  registration_id: editData ? registrationId : undefined,
                  username: editData ? undefined : username.trim(),
                  credits: amount,
                  remarks: editData ? undefined : notes.trim(),
                  points,
                  status: editData ? notes.trim() : undefined,
                },
                editData?.id,
              );
            }}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {editData ? "Update Wallet" : "Add Credit"}
          </button>
        </div>
      </div>
    </div>
  );
}
