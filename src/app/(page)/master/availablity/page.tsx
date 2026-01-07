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
import AlertAvailabilityModal from "./AlertAvailabilityModal";
import { alertAvailabilityData } from "@/data/frontendDummyData";

interface AlertAvailabilityModel {
  id: string;
  eta: string;
  availability_status: string;
}

const AlertAvailabilityPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<AlertAvailabilityModel | null>(null);
  const [alertList, setAlertList] = useState<AlertAvailabilityModel[]>(alertAvailabilityData);

  const fetchAlerts = async () => {
    try {
      const res = await axiosInstance.get("/masters/alert-availability");
      setAlertList(res.data);
    } catch (error) {
      console.log("Failed to fetch alert availability", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSubmit = async (
    data: { eta: string; availability_status: string },
    id?: string
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/alert-availability/${id}`, data);
      } else {
        await axiosInstance.post("/masters/alert-availability", data);
      }

      fetchAlerts();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving alert availability", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await axiosInstance.delete(`/masters/alert-availability/${id}`);
      fetchAlerts();
    } catch (error) {
      console.log("Error deleting record", error);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 
      dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">

      <AlertAvailabilityModal
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
          Alert Availability
        </h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          Add Alert
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 
            [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>#</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {alertList.map((item, index) => (
            <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
              
              <TableCell>{index + 1}</TableCell>

              <TableCell>
                {new Date(item.eta).toLocaleString()}
              </TableCell>

              <TableCell>{item.availability_status}</TableCell>

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

export default AlertAvailabilityPage;
