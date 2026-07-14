"use client";

import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Search, User, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

type Client = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  companyname?: string;
  wallete_balance?: number;
};

const CreditPage = () => {
  const [operationType, setOperationType] = useState<"add" | "deduct">("add");
  const [username, setUsername] = useState("");
  const [credits, setCredits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Client Search State
  const [clients, setClients] = useState<Client[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get("/user/clients", {
          params: { pageSize: 10000 },
        });
        setClients(response.data || []);
      } catch (error) {
        console.error("Failed to fetch clients for search", error);
      }
    };
    fetchClients();
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = username.trim() 
    ? clients.filter((client) => {
        const query = username.toLowerCase();
        return (
          client.firstname?.toLowerCase().includes(query) ||
          client.lastname?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.companyname?.toLowerCase().includes(query) ||
          client.username?.toLowerCase().includes(query)
        );
      }).slice(0, 5) // Limit to top 5 results for clean UI
    : [];

  const handleSelectClient = (client: Client) => {
    setUsername(client.email || client.username);
    setShowDropdown(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!username.trim()) {
      setFeedback({ type: "error", text: "Please select or enter a client user name/email." });
      return;
    }

    const creditValue = Number(credits);
    if (!Number.isFinite(creditValue) || creditValue <= 0) {
      setFeedback({ type: "error", text: "Please enter a valid credit amount." });
      return;
    }

    try {
      setSubmitting(true);
      
      const endpoint = operationType === "add" ? "/masters/wallet/credit" : "/masters/wallet/deduct";
      
      const response = await axiosInstance.post(endpoint, {
        username: username.trim(),
        credits: creditValue,
        remarks: operationType === "add" ? "Manual bonus by admin" : "Manual deduction by admin",
      });

      setFeedback({ 
        type: "success", 
        text: response?.data?.message || `Credit ${operationType === 'add' ? 'added' : 'deducted'} successfully.` 
      });
      setUsername("");
      setCredits("");
      
      // Auto clear success message
      setTimeout(() => setFeedback(null), 5000);
    } catch (error: any) {
      console.log("Error updating credit", error);
      setFeedback({ 
        type: "error", 
        text: error.response?.data?.message || "Unable to update wallet credit." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isAdd = operationType === "add";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-card-2 dark:border-dark-3 dark:bg-gray-dark">
        {/* Header Section */}
        <div className="border-b border-stroke bg-gray-1/50 px-8 py-6 dark:border-dark-3 dark:bg-dark-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                Wallet Adjustments
              </h2>
              <p className="mt-1 text-sm text-body-color dark:text-dark-6">
                Manually add bonus credits or deduct credits from a client's account.
              </p>
            </div>
            
            {/* Segmented Control Toggle */}
            <div className="flex w-full sm:w-auto bg-gray-2 p-1 rounded-lg dark:bg-dark-3 shadow-inner">
              <button
                type="button"
                onClick={() => { setOperationType("add"); setFeedback(null); }}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  isAdd 
                    ? "bg-white shadow-sm text-green-600 dark:bg-dark-2 dark:text-green-400" 
                    : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Add Credit
              </button>
              <button
                type="button"
                onClick={() => { setOperationType("deduct"); setFeedback(null); }}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  !isAdd 
                    ? "bg-white shadow-sm text-red-500 dark:bg-dark-2 dark:text-red-400" 
                    : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Deduct Credit
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Feedback Banner */}
          {feedback && (
            <div className={`mb-6 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
              feedback.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            
            {/* Client Search Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="mb-2.5 block font-medium text-dark dark:text-white">
                Client User Name or Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-5 dark:text-dark-6">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Type to search clients..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-[11px] pl-12 pr-4 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              {/* Dropdown Menu */}
              {showDropdown && username.trim() && (
                <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-lg border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-dark-2 overflow-hidden">
                  {filteredClients.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <li 
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-2 dark:hover:bg-dark-3 transition-colors border-b border-stroke/50 dark:border-dark-3/50 last:border-0"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h5 className="font-medium text-dark dark:text-white text-sm">
                              {client.firstname} {client.lastname}
                            </h5>
                            <p className="text-xs text-body-color dark:text-dark-6">
                              {client.email} {client.companyname ? `• ${client.companyname}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-4 text-center text-sm text-body-color dark:text-dark-6">
                      No clients found matching "{username}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="mb-2.5 block font-medium text-dark dark:text-white">
                {isAdd ? "Add Credit Amount" : "Deduct Credit Amount"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-dark-5 dark:text-dark-6">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-[11px] pl-9 pr-4 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-medium text-white transition-all disabled:opacity-70 ${
                  isAdd 
                    ? "bg-green-600 hover:bg-green-700 shadow-[0px_4px_12px_rgba(22,163,74,0.2)]" 
                    : "bg-red-500 hover:bg-red-600 shadow-[0px_4px_12px_rgba(239,68,68,0.2)]"
                }`}
              >
                {submitting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    {isAdd ? "Adding..." : "Deducting..."}
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    {isAdd ? "Process Credit Addition" : "Process Credit Deduction"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreditPage;
