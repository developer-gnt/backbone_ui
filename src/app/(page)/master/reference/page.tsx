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
import { PreviewIcon } from "@/components/Tables/icons";

import axiosInstance from "@/lib/axiosInstance";
import ReferenceModal from "./ReferenceModal";

interface ReferenceModel {
  id: string;
  source: string;
}

const ReferencePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<ReferenceModel | null>(null);
  const [references, setReferences] = useState<ReferenceModel[]>([]);

  const fetchReferences = async () => {
    try {
      const response = await axiosInstance.get("/masters/reference");
      setReferences(response.data);
    } catch (error) {
      console.log("Error fetching references:", error);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  const handleSubmit = async (source: string, id?: string) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/reference/${id}`, { source });
      } else {
        await axiosInstance.post("/masters/reference", { source });
      }

      fetchReferences();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving reference", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this reference?")) return;

    try {
      await axiosInstance.delete(`/masters/reference/${id}`);
      fetchReferences();
    } catch (error) {
      console.log("Error deleting reference:", error);
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
        <h2 className="text-xl font-semibold text-dark dark:text-white">References</h2>

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
            <TableHead className="min-w-[155px] xl:pl-7.5">#</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {references.map((ref, index) => (
            <TableRow key={ref.id} className="border-[#eee] dark:border-dark-3">
              <TableCell className="min-w-[155px] xl:pl-7.5">
                <p className="font-medium text-dark dark:text-white">{index + 1}</p>
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">{ref.source}</p>
              </TableCell>

              <TableCell className="xl:pr-7.5">
                <div className="flex items-center justify-end gap-x-3.5">

                  {/* EDIT */}
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

    </div>
  );
};

export default ReferencePage;
