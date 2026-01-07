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
import AddStateModal from "./AddStateModal";
import axiosInstance from "@/lib/axiosInstance";
import { statesData } from "@/data/frontendDummyData";

interface StateModel {
  id: string;
  name: string;
}

const States = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<StateModel | null>(null);
  const [stateData, setStateData] = useState<StateModel[]>(statesData);

  const fetchStates = async () => {
    try {
      const response = await axiosInstance.get("/masters/state");
      // setStateData(response.data);
    } catch (error) {
      console.log("Failed to fetch states", error);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleSubmit = async (name: string, id?: string) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/state/${id}`, { name });
      } else {
        await axiosInstance.post("/masters/state", { name });
      }

      fetchStates();
      setOpenModal(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving state", error);
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
        <h2 className="text-xl font-semibold text-dark dark:text-white">States</h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
        >
          Add State
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[155px] xl:pl-7.5">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {stateData.map((state, index) => (
            <TableRow key={state.id} className="border-[#eee] dark:border-dark-3">
              <TableCell className="min-w-[155px] xl:pl-7.5">
                <p className="font-medium text-dark dark:text-white">
                  {index + 1}
                </p>
              </TableCell>

              <TableCell>
                <p className="text-dark dark:text-white">{state.name}</p>
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

                  <button className="hover:text-primary">
                    <span className="sr-only">Delete State</span>
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

export default States;
