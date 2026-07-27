"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { FileText, Eye, Edit2, Clock, MapPin, Building2 } from "lucide-react";
import Link from "next/link";

export default function UnifiedInspectionRecordsPage() {
  const [inspectionType, setInspectionType] = useState<"2.6" | "3.6">("2.6");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const endpoint = inspectionType === "2.6" ? "/inspection26" : "/inspection36";
        const response = await axiosInstance.get(endpoint);
        setRecords(response.data);
      } catch (error) {
        console.error("Failed to fetch inspection records", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [inspectionType]);

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Inspection Records
          </h2>
          <p className="text-sm text-dark-5 mt-1">View all submitted UAD inspections</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-gray-200 p-1 rounded-[10px] dark:bg-dark-3 shadow-inner">
          <button
            onClick={() => setInspectionType("2.6")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              inspectionType === "2.6"
                ? "bg-white text-primary shadow-sm dark:bg-dark-2"
                : "text-dark-5 hover:text-dark dark:hover:text-white"
            }`}
          >
            Inspection 2.6
          </button>
          <button
            onClick={() => setInspectionType("3.6")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              inspectionType === "3.6"
                ? "bg-white text-primary shadow-sm dark:bg-dark-2"
                : "text-dark-5 hover:text-dark dark:hover:text-white"
            }`}
          >
            Inspection 3.6
          </button>
        </div>

        <Link
          href={inspectionType === "2.6" ? "/master/inspection26" : "/master/inspection36"}
          onClick={() => {
            if (inspectionType === "3.6") {
              localStorage.removeItem("ieimpact_uad36_inspect");
              localStorage.removeItem("ieimpact_uad36_step");
            } else {
              localStorage.removeItem("ieimpact_uad26_inspect");
              localStorage.removeItem("ieimpact_uad26_step");
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
        >
          <FileText className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-[#F7F9FC] text-left dark:bg-dark-2">
                <th className="px-4 py-4 font-medium text-dark dark:text-white xl:pl-7.5">
                  ID / File #
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  Property Address
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  {inspectionType === "2.6" ? "Report Type" : "Property Type"}
                </th>
                <th className="px-4 py-4 font-medium text-dark dark:text-white">
                  Date
                </th>
                <th className="px-4 py-4 text-right font-medium text-dark dark:text-white xl:pr-7.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-dark-5">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-dark-5">
                    No inspection records found.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`border-b border-stroke dark:border-dark-3 ${
                      index === records.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-4 xl:pl-7.5">
                      <p className="font-semibold text-dark dark:text-white">
                        {record.fileno || `...${record.id.substring(record.id.length - 6)}`}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <p className="text-dark dark:text-white">
                          {record.address || "N/A"}, {record.city || ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-dark-5" />
                        <p className="text-dark dark:text-white">
                          {inspectionType === "2.6" ? record.reporttype || "N/A" : record.proptype || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-dark-5" />
                        <p className="text-dark dark:text-white">
                          {inspectionType === "2.6" 
                            ? (record.inspectiondate || new Date(Number(record.created_on)).toLocaleDateString())
                            : (record.date || new Date(Number(record.created_on)).toLocaleDateString())}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right xl:pr-7.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/master/${inspectionType === "2.6" ? "inspection26" : "inspection36"}?id=${record.id}&mode=view`}
                          className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-gray-2 px-3 py-1.5 text-sm font-medium hover:bg-gray-3 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          href={`/master/${inspectionType === "2.6" ? "inspection26" : "inspection36"}?id=${record.id}&mode=edit`}
                          className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
