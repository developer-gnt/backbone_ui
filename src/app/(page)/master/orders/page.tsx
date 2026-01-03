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
import OrderTypeModal from "./OrderTypeModal";

interface OrderTypeModel {
  id: string;
  order_type: string;
  sequence_number: number;
}

const OrderTypePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<OrderTypeModel | null>(null);
  const [orderTypes, setOrderTypes] = useState<OrderTypeModel[]>([]);

  const fetchOrderTypes = async () => {
    try {
      const response = await axiosInstance.get("/masters/order-type");
      setOrderTypes(response.data);
    } catch (error) {
      console.log("Failed to fetch order types", error);
    }
  };

  useEffect(() => {
    fetchOrderTypes();
  }, []);

  const handleSubmit = async (
    data: { order_type: string; sequence_number: number },
    id?: string
  ) => {
    try {
      if (id) {
        await axiosInstance.patch(`/masters/order-type/${id}`, data); // PATCH
      } else {
        await axiosInstance.post("/masters/order-type", data);
      }

      fetchOrderTypes();
      setModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.log("Error saving order type", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order type?")) return;

    try {
      await axiosInstance.delete(`/masters/order-type/${id}`);
      fetchOrderTypes();
    } catch (error) {
      console.log("Error deleting order type", error);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">

      <OrderTypeModal
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
          Order Types
        </h2>

        <button
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
        >
          Add Order Type
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead>#</TableHead>
            <TableHead>Order Type</TableHead>
            <TableHead>Sequence Number</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orderTypes.map((item, index) => (
            <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.order_type}</TableCell>
              <TableCell>{item.sequence_number}</TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-x-3.5">

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

export default OrderTypePage;
