"use client";

import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import InputGroup from "@/components/FormElements/InputGroup";

type PackageOption = {
  id: number | string;
  title?: string;
  duration?: string;
  price?: number | string;
  credit?: number | string;
};

const TransactionPage = () => {
  const [username, setUsername] = useState("");
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const normalized = username.trim();

    if (!normalized) {
      setPackages([]);
      setSelectedPackageId("");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingPackages(true);
        const response = await axiosInstance.get("/masters/package", {
          params: { username: normalized },
        });

        const items = Array.isArray(response.data) ? response.data : [];
        setPackages(items);
        setSelectedPackageId("");
      } catch (error) {
        console.log("Error fetching packages", error);
        setPackages([]);
        setSelectedPackageId("");
      } finally {
        setLoadingPackages(false);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [username]);

  const selectedPackage = useMemo(
    () => packages.find((item) => `${item.id}` === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const amount = selectedPackage ? `${selectedPackage.price ?? ""}` : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) {
      alert("Please enter the client user name or email.");
      return;
    }

    if (!selectedPackageId) {
      alert("Please select credit type.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosInstance.post("/masters/wallet/package", {
        username: username.trim(),
        package_id: Number(selectedPackageId),
      });

      alert(response?.data?.message || "Transaction Add Successfully");
      setUsername("");
      setPackages([]);
      setSelectedPackageId("");
    } catch (error) {
      console.log("Error saving transaction", error);
      alert("Unable to add transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6">
        <p className="text-sm text-dark-5">Overview</p>
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          Master <span className="font-normal">/ Add Transactions</span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <InputGroup
          label="User Name"
          type="text"
          placeholder="Enter client user name or email"
          value={username}
          handleChange={(e) => setUsername(e.target.value)}
        />

        <div>
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Credit Score
          </label>
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="mt-3 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            disabled={loadingPackages || !packages.length}
          >
            <option value="">
              {loadingPackages ? "Loading credit types..." : "Select Credit Type"}
            </option>
            {packages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.credit ?? item.title ?? item.duration ?? item.id}
              </option>
            ))}
          </select>
        </div>

        <InputGroup
          label="Amount"
          type="text"
          placeholder="Amount"
          value={amount}
          disabled
        />

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-5 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionPage;
