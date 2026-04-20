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
import axiosInstance from "@/lib/axiosInstance";

interface FormsModel {
  id: number;
  form: string;
}

const FormsPage = () => {
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [formName, setFormName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSequenceNumber, setEditingSequenceNumber] = useState("");
  const [editingFormName, setEditingFormName] = useState("");
  const [formsList, setFormsList] = useState<FormsModel[]>([]);

  const fetchForms = async () => {
    try {
      const response = await axiosInstance.get("/masters/forms");
      setFormsList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log("Failed to fetch forms", error);
      setFormsList([]);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const seqValue = Number(sequenceNumber);
    if (!Number.isFinite(seqValue) || seqValue <= 0) {
      alert("Please enter valid sequence number.");
      return;
    }

    if (!formName.trim()) {
      alert("Please enter form name.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosInstance.post("/masters/forms", {
        id: seqValue,
        form: formName.trim(),
      });

      alert(response?.data?.message || "Form Add Successfully");
      setSequenceNumber("");
      setFormName("");
      await fetchForms();
    } catch (error) {
      console.log("Error saving form", error);
      alert("Unable to save form.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: FormsModel) => {
    setEditingId(item.id);
    setEditingSequenceNumber(`${item.id}`);
    setEditingFormName(item.form || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingSequenceNumber("");
    setEditingFormName("");
  };

  const handleUpdate = async (id: number) => {
    if (!editingFormName.trim()) {
      alert("Please enter form name.");
      return;
    }

    try {
      const response = await axiosInstance.patch(`/masters/forms/${id}`, {
        form: editingFormName.trim(),
      });

      alert(response?.data?.message || "Form Updated Successfully");
      handleCancel();
      await fetchForms();
    } catch (error) {
      console.log("Error updating form", error);
      alert("Unable to update form.");
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6">
        <p className="text-sm text-dark-5">Overview</p>
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Master <span className="font-normal">Add/Update forms</span>
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid gap-3 md:grid-cols-12 md:items-center">
          <label className="text-sm font-medium text-dark dark:text-white md:col-span-3">
            Sequence Number
          </label>
          <div className="md:col-span-6">
            <input
              type="number"
              value={sequenceNumber}
              onChange={(e) => setSequenceNumber(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-12 md:items-center">
          <label className="text-sm font-medium text-dark dark:text-white md:col-span-3">
            Form Name
          </label>
          <div className="md:col-span-6">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>

        <div className="border-t border-stroke pt-5 dark:border-dark-3" />

        <div className="grid md:grid-cols-12">
          <div className="md:col-span-6 md:col-start-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-5 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead></TableHead>
              <TableHead>Sequence Number</TableHead>
              <TableHead>Form Name</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {formsList.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90"
                          onClick={() => handleUpdate(item.id)}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="rounded border border-stroke px-3 py-1 text-sm hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-3"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                    )}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <input
                        value={editingSequenceNumber}
                        onChange={(e) => setEditingSequenceNumber(e.target.value)}
                        className="w-full rounded border border-stroke px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
                      />
                    ) : (
                      item.id
                    )}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <input
                        value={editingFormName}
                        onChange={(e) => setEditingFormName(e.target.value)}
                        className="w-full rounded border border-stroke px-3 py-2 dark:border-dark-3 dark:bg-dark-2"
                      />
                    ) : (
                      item.form || "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {formsList.length === 0 && (
          <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
            There are no Forms,We recomended you to add Forms.
          </p>
        )}
      </div>
    </div>
  );
};

export default FormsPage;
