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
import AddStateModal from "./AddStateModal";
import axiosInstance from "@/lib/axiosInstance";

interface StateModel {
  id: number;
  city: string;
}

const States = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<StateModel | null>(null);
  const [stateData, setStateData] = useState<StateModel[]>([]);

  const fetchStates = async () => {
    try {
      const response = await axiosInstance.get("/masters/state");
      setStateData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log("Failed to fetch states", error);
      setStateData([]);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleSubmit = async (city: string, id?: number) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/state/${id}`, { city });
      } else {
        await axiosInstance.post("/masters/state", { city });
      }

      await fetchStates();
      setOpenModal(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving state", error);
      alert("Unable to save state/city.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete is disabled in the backend for live city data. Continue anyway?")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/masters/state/${id}`);
      alert(response.data?.message || "Delete request completed.");
      await fetchStates();
    } catch (error) {
      console.log("Error deleting state", error);
      alert("Unable to delete this state/city.");
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <AddStateModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditData(null);
        }}
        onSubmit={handleSubmit}
        editData={editData}
      />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          States / Cities
        </h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
        >
          Add Location
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[155px] xl:pl-7.5">ID</TableHead>
            <TableHead>City / State</TableHead>
            <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {stateData.map((state) => (
            <TableRow key={state.id} className="border-[#eee] dark:border-dark-3">
              <TableCell className="min-w-[155px] xl:pl-7.5">
                <p className="font-medium text-dark dark:text-white">{state.id}</p>
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">{state.city || "-"}</p>
              </TableCell>

              <TableCell className="xl:pr-7.5">
                <div className="flex items-center justify-end gap-x-3.5">
                  <button
                    className="hover:text-primary"
                    onClick={() => {
                      setEditData(state);
                      setOpenModal(true);
                    }}
                  >
                    <span className="sr-only">Edit State</span>
                    <PencilSquareIcon />
                  </button>

                  <button
                    className="hover:text-primary"
                    onClick={() => handleDelete(state.id)}
                  >
                    <span className="sr-only">Delete State</span>
                    <TrashIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {stateData.length === 0 && (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
          No state or city records found.
        </p>
      )}
    </div>
  );
};

export default States;
