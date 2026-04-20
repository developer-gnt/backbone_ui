"use client";

import React, { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import InputGroup from "@/components/FormElements/InputGroup";

const CreditPage = () => {
  const [username, setUsername] = useState("");
  const [credits, setCredits] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) {
      alert("Please enter the client user name or email.");
      return;
    }

    const creditValue = Number(credits);
    if (!Number.isFinite(creditValue) || creditValue < 0) {
      alert("Please enter a valid credit amount.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosInstance.post("/masters/wallet/credit", {
        username: username.trim(),
        credits: creditValue,
        remarks: "Manual bonus by admin",
      });

      alert(response?.data?.message || "Credit updated successfully.");
      setUsername("");
      setCredits("");
    } catch (error) {
      console.log("Error saving credit", error);
      alert("Unable to update wallet credit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-dark dark:text-white">Add Credit</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <InputGroup
          label="User Name"
          type="text"
          placeholder="Enter client user name or email"
          value={username}
          handleChange={(e) => setUsername(e.target.value)}
        />

        <InputGroup
          label="Add Credit"
          type="number"
          placeholder="Enter credit amount"
          value={credits}
          handleChange={(e) => setCredits(e.target.value)}
        />

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-5 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Credit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreditPage;
