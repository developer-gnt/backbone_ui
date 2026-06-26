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
import CustomPricingList from "./CustomPricingList";
import axiosInstance from "@/lib/axiosInstance";

interface PackageModel {
  id: number;
  title: string;
  duration?: string;
  price: string | number;
  credit: string | number;
}


const PackagesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<PackageModel | null>(null);
  const [packages, setPackages] = useState<PackageModel[]>([]);
  const [customPricing, setCustomPricing] = useState<any[]>([]);

  const fetchPackages = async () => {
    try {
      const response = await axiosInstance.get("/masters/package");
      setPackages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log("Error fetching packages", error);
      setPackages([]);
    }
  };

  const fetchCustomPricing = async () => {
    try {
      const response = await axiosInstance.get("/masters/package/pricing-overrides");
      setCustomPricing(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setCustomPricing([]);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchCustomPricing();
  }, []);

  const handleSubmit = async (
    data: { title: string; duration: string; price: number; credit: number },
    id?: number,
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/package/${id}`, data);
      } else {
        await axiosInstance.post("/masters/package", data);
      }

      await fetchPackages();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving package", error);
      alert("Unable to save package.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete is disabled in the backend for live package data. Continue anyway?")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/masters/package/${id}`);
      alert(response.data?.message || "Delete request completed.");
      await fetchPackages();
    } catch (error) {
      console.log("Error deleting package", error);
      alert("Unable to delete package.");
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
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Packages
        </h2>

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
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {packages.map((pkg, index) => (
            <TableRow key={pkg.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{pkg.title || "-"}</TableCell>
              <TableCell>{pkg.duration || "-"}</TableCell>
              <TableCell>₹ {pkg.price}</TableCell>
              <TableCell>{pkg.credit}</TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-x-3.5">
                  <button
                    className="hover:text-primary"
                    onClick={() => {
                      setEditData(pkg);
                      setModalOpen(true);
                    }}
                  >
                    <PencilSquareIcon />
                  </button>

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


      {packages.length === 0 && (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
          No package records found.
        </p>
      )}

      {/* Custom Pricing List Section */}
      <CustomPricingList overrides={customPricing} />
    </div>
  );
};

export default PackagesPage;
