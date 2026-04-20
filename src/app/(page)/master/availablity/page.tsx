"use client";

import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

interface AlertAvailabilityModel {
  package: string;
  msg: string;
}

const ETA_OPTIONS = ["24", "12", "06"];

const AlertAvailabilityPage = () => {
  const [selectedEta, setSelectedEta] = useState("24");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [alertList, setAlertList] = useState<AlertAvailabilityModel[]>([]);

  const selectedRecord = useMemo(
    () => alertList.find((item) => `${item.package}` === selectedEta) ?? null,
    [alertList, selectedEta],
  );

  const fetchAlerts = async () => {
    try {
      const res = await axiosInstance.get("/masters/alert-availability");
      setAlertList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Failed to fetch alert availability", error);
      setAlertList([]);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    setMessage(selectedRecord?.msg || "");
  }, [selectedRecord]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setStatusMessage("");

      const response = selectedRecord
        ? await axiosInstance.patch(`/masters/alert-availability/${selectedEta}`, {
            package: selectedEta,
            msg: message,
          })
        : await axiosInstance.post("/masters/alert-availability", {
            package: selectedEta,
            msg: message,
          });

      const successText =
        response?.data?.message || "updation done successfully";
      setStatusMessage(successText);
      alert(successText);
      await fetchAlerts();
    } catch (error) {
      console.log("Error saving alert availability", error);
      alert("Unable to update availability status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6">
        <p className="text-sm text-dark-5">Overview</p>
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Change availability status
        </h2>
        <p className="mt-2 text-sm text-red-500">{statusMessage}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 md:grid-cols-12 md:items-center">
          <label className="text-sm font-medium text-dark dark:text-white md:col-span-3">
            ETA
          </label>
          <div className="md:col-span-6">
            <select
              value={selectedEta}
              onChange={(e) => setSelectedEta(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            >
              {ETA_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-12 md:items-start">
          <label className="pt-3 text-sm font-medium text-dark dark:text-white md:col-span-3">
            Availability Status
          </label>
          <div className="md:col-span-6">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-12">
          <div className="md:col-span-6 md:col-start-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-5 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AlertAvailabilityPage;
