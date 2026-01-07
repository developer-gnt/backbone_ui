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

import { TrashIcon, PencilSquareIcon } from "@/assets/icons";
import axiosInstance from "@/lib/axiosInstance";
import FormModal from "./FormModal";
import { formsData } from "@/data/frontendDummyData";

interface FormsModel {
  id: string;
  form: string;
  sequence_number: number;
}

const FormsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<FormsModel | null>(null);
  const [formsList, setFormsList] = useState<FormsModel[]>(formsData);

  const fetchForms = async () => {
    try {
      const response = await axiosInstance.get("/masters/forms");
      setFormsList(response.data);
    } catch (error) {
      console.log("Failed to fetch forms", error);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleSubmit = async (
    data: { form: string; sequence_number: number },
    id?: string
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/forms/${id}`, data);
      } else {
        await axiosInstance.post("/masters/forms", data);
      }

      fetchForms();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving form", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      await axiosInstance.delete(`/masters/forms/${id}`);
      fetchForms();
    } catch (error) {
      console.log("Error deleting form", error);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">

      <FormModal
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
          Forms
        </h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          Add Form
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>#</TableHead>
            <TableHead>Form Name</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {formsList.map((item, index) => (
            <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.form}</TableCell>
              <TableCell>{item.sequence_number}</TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-x-3.5">

                  {/* EDIT */}
                  <button
                    className="hover:text-primary"
                    onClick={() => {
                      setEditData(item);
                      setModalOpen(true);
                    }}
                  >
                    <PencilSquareIcon />
                  </button>

                  {/* DELETE */}
                  <button
                    className="hover:text-primary"
                    onClick={() => handleDelete(item.id)}
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

export default FormsPage;
