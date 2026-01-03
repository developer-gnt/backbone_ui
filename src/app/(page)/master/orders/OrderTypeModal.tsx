"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface OrderTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { order_type: string; sequence_number: number },
    id?: string
  ) => void;
  editData?: {
    id: string;
    order_type: string;
    sequence_number: number;
  } | null;
}

export default function OrderTypeModal({
  open,
  onClose,
  onSubmit,
  editData,
}: OrderTypeModalProps) {
  const [orderType, setOrderType] = useState("");
  const [sequence, setSequence] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setOrderType(editData.order_type);
      setSequence(editData.sequence_number);
    } else {
      setOrderType("");
      setSequence(0);
    }
  }, [editData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">

        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {editData ? "Edit Order Type" : "Add Order Type"}
        </h3>

        <div className="space-y-4">
          <InputGroup
            label="Order Type"
            type="text"
            placeholder="Enter order type"
            value={orderType}
            handleChange={(e) => setOrderType(e.target.value)}
          />

          <InputGroup
            label="Sequence Number"
            type="number"
            placeholder="Enter sequence number"
            value={String(sequence)}  // FIX for number→string
            handleChange={(e) => setSequence(Number(e.target.value))}
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
                { order_type: orderType, sequence_number: sequence },
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
