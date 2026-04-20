"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilSquareIcon, TrashIcon } from "@/assets/icons";
import axiosInstance from "@/lib/axiosInstance";
import ReferenceModal from "./ReferenceModal";

interface ReferenceModel {
  id: number;
  reference_source: string;
}

const ReferencePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<ReferenceModel | null>(null);
  const [references, setReferences] = useState<ReferenceModel[]>([]);

  const fetchReferences = async () => {
    try {
      const response = await axiosInstance.get("/masters/reference");
      setReferences(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log("Error fetching references:", error);
      setReferences([]);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  const handleSubmit = async (referenceSource: string, id?: number) => {
    try {
      const payload = { reference_source: referenceSource };

      if (id) {
        await axiosInstance.patch(`/masters/reference/${id}`, payload);
      } else {
        await axiosInstance.post("/masters/reference", payload);
      }

      await fetchReferences();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving reference", error);
      alert("Unable to save reference source.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete is disabled in the backend for live reference data. Continue anyway?")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/masters/reference/${id}`);
      alert(response.data?.message || "Delete request completed.");
      await fetchReferences();
    } catch (error) {
      console.log("Error deleting reference:", error);
      alert("Unable to delete reference source.");
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <ReferenceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        onSubmit={handleSubmit}
        editData={editData}
      />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Reference Sources
        </h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          Add Reference
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[155px] xl:pl-7.5">ID</TableHead>
            <TableHead>Reference Source</TableHead>
            <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {references.map((ref) => (
            <TableRow key={ref.id} className="border-[#eee] dark:border-dark-3">
              <TableCell className="min-w-[155px] xl:pl-7.5">
                <p className="font-medium text-dark dark:text-white">{ref.id}</p>
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">
                  {ref.reference_source || "-"}
                </p>
              </TableCell>

              <TableCell className="xl:pr-7.5">
                <div className="flex items-center justify-end gap-x-3.5">
                  <button
                    className="hover:text-primary"
                    onClick={() => {
                      setEditData(ref);
                      setModalOpen(true);
                    }}
                  >
                    <PencilSquareIcon />
                  </button>

                  <button
                    className="hover:text-primary"
                    onClick={() => handleDelete(ref.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {references.length === 0 && (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
          No reference records found.
        </p>
      )}
    </div>
  );
};

export default ReferencePage;
