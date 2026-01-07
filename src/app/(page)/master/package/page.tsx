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
import PackageModal from "./PackageModal";
import axiosInstance from "@/lib/axiosInstance";
import { packageData } from "@/data/frontendDummyData";

interface PackageModel {
  id: string;
  title: string;
  duration: number;
  price: number;
}

const PackagesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<PackageModel | null>(null);
  const [packages, setPackages] = useState<PackageModel[]>(packageData);

  const fetchPackages = async () => {
    try {
      const response = await axiosInstance.get("/masters/package");
      setPackages(response.data);
    } catch (error) {
      console.log("Error fetching packages", error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (
    data: { title: string; duration: number; price: number },
    id?: string
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/package/${id}`, data); 
      } else {
        await axiosInstance.post("/masters/package", data);
      }

      fetchPackages();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving package", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      await axiosInstance.delete(`/masters/package/${id}`);
      fetchPackages();
    } catch (error) {
      console.log("Error deleting package", error);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">

      <PackageModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        onSubmit={handleSubmit}
        editData={editData}
      />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">Packages</h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          Add Package
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {packages.map((pkg, index) => (
            <TableRow key={pkg.id} className="border-[#eee] dark:border-dark-3">
              
              <TableCell>{index + 1}</TableCell>
              <TableCell>{pkg.title}</TableCell>
              <TableCell>{pkg.duration} Days</TableCell>
              <TableCell>₹ {pkg.price}</TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-x-3.5">

                  {/* EDIT */}
                  <button
                    className="hover:text-primary"
                    onClick={() => {
                      setEditData(pkg);
                      setModalOpen(true);
                    }}
                  >
                    <PencilSquareIcon />
                  </button>

                  {/* DELETE */}
                  <button
                    className="hover:text-primary"
                    onClick={() => handleDelete(pkg.id)}
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

export default PackagesPage;
