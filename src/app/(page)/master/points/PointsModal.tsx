"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface PointsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { registration_id: number; points: number; wallet_amount?: number },
    id?: number,
  ) => void;
  editData?: {
    id: number;
    points: number | string | null;
    wallete_balance?: number | string | null;
  } | null;
}

export default function PointsModal({
  open,
  onClose,
  onSubmit,
  editData,
}: PointsModalProps) {
  const [registrationId, setRegistrationId] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [walletAmount, setWalletAmount] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setRegistrationId(editData.id);
      setPoints(Number(editData.points || 0));
      setWalletAmount(0);
    } else {
      setRegistrationId(0);
      setPoints(0);
      setWalletAmount(0);
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Points" : "Add Points"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="Registration ID"
            type="number"
            placeholder="Enter registration id"
            value={String(registrationId || "")}
            handleChange={(e) => setRegistrationId(Number(e.target.value))}
          />

          <InputGroup
            label="Points"
            type="number"
            placeholder="Enter points"
            value={String(points)}
            handleChange={(e) => setPoints(Number(e.target.value))}
          />

          <InputGroup
            label="Wallet Amount (optional)"
            type="number"
            placeholder="Use when converting or adjusting wallet"
            value={String(walletAmount)}
            handleChange={(e) => setWalletAmount(Number(e.target.value))}
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
                  registration_id: registrationId,
                  points,
                  wallet_amount: walletAmount,
                },
                editData?.id,
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
