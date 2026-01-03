"use client";

import React, { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";

interface PointsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: { user_name: string; point: number },
    id?: string
  ) => void;
  editData?: { id: string; user_name: string; point: number } | null;
}

export default function PointsModal({
  open,
  onClose,
  onSubmit,
  editData,
}: PointsModalProps) {
  const [userName, setUserName] = useState("");
  const [point, setPoint] = useState<number>(0);

  useEffect(() => {
    if (editData) {
      setUserName(editData.user_name);
      setPoint(editData.point);
    } else {
      setUserName("");
      setPoint(0);
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
            label="User Name"
            type="text"
            placeholder="Enter user name"
            value={userName}
            handleChange={(e) => setUserName(e.target.value)}
          />

          <InputGroup
            label="Points"
            type="number"
            placeholder="Enter points"
            value={String(point)}
            handleChange={(e) => setPoint(Number(e.target.value))}
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
                { user_name: userName, point },
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
