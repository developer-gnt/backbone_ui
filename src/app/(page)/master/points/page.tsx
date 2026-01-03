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
import PointsModal from "./PointsModal";

interface PointsModel {
  id: string;
  user_name: string;
  point: number;
}

const PointsPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<PointsModel | null>(null);
  const [pointsData, setPointsData] = useState<PointsModel[]>([]);

  const fetchPoints = async () => {
    try {
      const response = await axiosInstance.get("/masters/points");
      setPointsData(response.data);
    } catch (error) {
      console.log("Failed to fetch points", error);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleSubmit = async (
    data: { user_name: string; point: number },
    id?: string
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/points/${id}`, data); // PATCH
      } else {
        await axiosInstance.post("/masters/points", data);
      }

      fetchPoints();
      setOpenModal(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving points", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await axiosInstance.delete(`/masters/points/${id}`);
      fetchPoints();
    } catch (error) {
      console.log("Error deleting points", error);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">

      <PointsModal
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
          Points
        </h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
        >
          Add Points
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>#</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Points</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pointsData.map((item, index) => (
            <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.user_name}</TableCell>
              <TableCell>{item.point}</TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-x-3.5">
                  
                  <button
                    className="hover:text-primary"
                    onClick={() => {
                      setEditData(item);
                      setOpenModal(true);
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

export default PointsPage;
