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
import CreditModal from "./CreditModal";
import { creditData } from "@/data/frontendDummyData";

interface CreditModel {
  id: string;
  name: string;
  credit: number;
}

const CreditPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<CreditModel | null>(null);
  const [credits, setCredits] = useState<CreditModel[]>(creditData);

  const fetchCredits = async () => {
    try {
      const response = await axiosInstance.get("/masters/credit");
      setCredits(response.data);
    } catch (error) {
      console.log("Error fetching credits", error);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleSubmit = async (
    data: { name: string; credit: number },
    id?: string
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/credit/${id}`, data);
      } else {
        await axiosInstance.post("/masters/credit", data);
      }

      fetchCredits();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving credit", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credit?")) return;

    try {
      await axiosInstance.delete(`/masters/credit/${id}`);
      fetchCredits();
    } catch (error) {
      console.log("Error deleting credit", error);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">

      <CreditModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        onSubmit={handleSubmit}
        editData={editData}
      />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">Credits</h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          Add Credit
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {credits.map((item, index) => (
            <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.credit}</TableCell>

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

export default CreditPage;
