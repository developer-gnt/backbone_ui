"use client";

import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { API_BASE_URL, getApiErrorMessage } from "@/lib/axiosInstance";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type StateOption = {
  id?: number | string;
  city?: string;
};

type RegistrationMeta = {
  states: StateOption[];
  softwareOptions: string[];
};

type RegistrationForm = {
  firstname: string;
  lastname: string;
  email: string;
  software: string;
  companyname: string;
  mobileno: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  username: string;
  agreeToTerms: boolean;
};

const initialForm: RegistrationForm = {
  firstname: "",
  lastname: "",
  email: "",
  software: "",
  companyname: "",
  mobileno: "",
  address: "",
  city: "",
  state: "",
  zipcode: "",
  username: "",
  agreeToTerms: false,
};

export default function ClientRegistrationPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [meta, setMeta] = useState<RegistrationMeta>({ states: [], softwareOptions: [] });
  const [submitting, setSubmitting] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<{
    type: "success" | "error" | "checking";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace((user?.role ?? "").toLowerCase() === "client" ? "/client/new-order" : "/");
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);

      try {
        const response = await axiosInstance.get("/auth/registration-meta");
        const nextMeta = {
          states: Array.isArray(response.data?.states) ? response.data.states : [],
          softwareOptions: Array.isArray(response.data?.softwareOptions)
            ? response.data.softwareOptions
            : [],
        };

        setMeta(nextMeta);
        setForm((prev) => ({
          ...prev,
          software: prev.software || nextMeta.softwareOptions[0] || "Aurora (a la mode)",
          state: prev.state || nextMeta.states[0]?.city || "",
        }));
      } catch (error) {
        setFeedback({
          type: "error",
          text: getApiErrorMessage(error, "Unable to load registration form details."),
        });
      } finally {
        setLoadingMeta(false);
      }
    };

    void loadMeta();
  }, []);

  const usernameHelperClass = useMemo(() => {
    if (!usernameStatus) return "text-dark-5";
    if (usernameStatus.type === "success") return "text-green-600";
    if (usernameStatus.type === "checking") return "text-blue-600";
    return "text-red-600";
  }, [usernameStatus]);

  const updateField = (key: keyof RegistrationForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "username") {
      setUsernameStatus(null);
    }
  };

  const handleUsernameBlur = async () => {
    const username = form.username.trim();

    if (!username) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus({ type: "checking", text: "Checking username availability..." });

    try {
      const response = await axiosInstance.get("/auth/check-username", {
        params: { username },
      });

      setUsernameStatus({
        type: response.data?.available ? "success" : "error",
        text: response.data?.message || "Unable to validate username.",
      });
    } catch (error) {
      setUsernameStatus({
        type: "error",
        text: getApiErrorMessage(error, "Unable to validate username."),
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    if (!form.agreeToTerms) {
      setSubmitting(false);
      setFeedback({ type: "error", text: "Please accept the terms and privacy policy." });
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/client-registration", form);
      setFeedback({
        type: "success",
        text:
          response.data?.message ||
          "Registration successfully done. We will review your profile and get back to you.",
      });
      setForm((prev) => ({
        ...initialForm,
        software: prev.software || meta.softwareOptions[0] || "",
        state: prev.state || meta.states[0]?.city || "",
      }));
      setUsernameStatus(null);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Registration failed. Please try again."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="border-b border-stroke bg-slate-800 px-5 py-5 dark:border-dark-3 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="https://backbonedatasolutions.com/" className="inline-flex items-center">
            <Image
              src="/images/backbone-logo.webp"
              alt="Backbone Data Solutions"
              width={220}
              height={40}
              priority
            />
          </Link>

          <p className="animate-pulse text-sm font-semibold text-red-400 sm:text-base">
            You are one step away from getting free credit!
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Client Registration</h1>
          <p className="mt-2 text-sm text-dark-5">
            Create your client profile to request assignments with Backbone Data Solutions. This page is public and does not require login.
          </p>
          <p className="mt-1 text-xs text-dark-5">
            API endpoint: <span className="font-medium text-dark dark:text-white">{API_BASE_URL}</span>
          </p>
        </div>

        {feedback && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">First Name</label>
              <input
                value={form.firstname}
                onChange={(event) => updateField("firstname", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. Brock"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Last Name</label>
              <input
                value={form.lastname}
                onChange={(event) => updateField("lastname", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. Griffin"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. roy@gmail.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Select Software</label>
              <select
                value={form.software}
                onChange={(event) => updateField("software", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              >
                {(meta.softwareOptions.length ? meta.softwareOptions : ["Aurora (a la mode)"]).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Company Name</label>
              <input
                value={form.companyname}
                onChange={(event) => updateField("companyname", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. Amazon"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Mobile Number</label>
              <input
                value={form.mobileno}
                onChange={(event) => updateField("mobileno", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. 9899872323"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Address</label>
              <input
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. 2297 Newcastle Ave, San Diego, CA 92007"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">City</label>
              <input
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. San Diego"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">State</label>
              <select
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                required
              >
                <option value="">--select state--</option>
                {meta.states.map((item, index) => (
                  <option key={`${item.id ?? item.city ?? index}`} value={item.city || ""}>
                    {item.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Zip Code</label>
              <input
                value={form.zipcode}
                onChange={(event) => updateField("zipcode", event.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Eg. 576749"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Login Name</label>
            <input
              value={form.username}
              onChange={(event) => updateField("username", event.target.value.replace(/\s+/g, ""))}
              onBlur={handleUsernameBlur}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              placeholder="Eg. Brock123"
              required
            />
            <p className={`mt-2 text-xs ${usernameHelperClass}`}>
              {usernameStatus?.text || "Use 6-10 letters and numbers only."}
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-stroke px-4 py-3 text-sm text-dark dark:border-dark-3 dark:text-white">
            <input
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={(event) => updateField("agreeToTerms", event.target.checked)}
              className="mt-1 accent-primary"
            />
            <span>
              I accept Backbone Data Solutions <a href="https://backbonedatasolutions.com/terms-conditions" className="text-red-500 underline">terms</a> of use and <a href="https://backbonedatasolutions.com/privacy-policy/" className="text-red-500 underline">privacy policy</a>.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-dark-5">
              If you are already registered, please <Link href="/auth/sign-in" className="font-medium text-primary">log in</Link>.
            </p>

            <button
              type="submit"
              disabled={submitting || loadingMeta || usernameStatus?.type === "error"}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
