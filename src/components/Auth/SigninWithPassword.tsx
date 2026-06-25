"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { API_BASE_URL } from "@/lib/axiosInstance";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import { useAuth } from "./AuthProvider";

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();

  const nextUrl = useMemo(() => {
    const requestedNext = searchParams.get("next");

    if (requestedNext) {
      return requestedNext;
    }

    return `${user?.role ?? ""}`.trim().toLowerCase() === "client"
      ? "/client/new-order"
      : "/";
  }, [searchParams, user?.role]);

  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [isAuthenticated, nextUrl, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const currentUser = await login(data.email.trim(), data.password);
      const destination =
        searchParams.get("next") ||
        ((currentUser?.role ?? "").toLowerCase() === "client"
          ? "/client/new-order"
          : "/");
      router.replace(destination);
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      

      {errorMessage && (
        <p className="rounded-md bg-red-100 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <InputGroup
        type="text"
        label="Email / Username"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your email or username"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type="password"
        label="Password"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
      />

      <label className="flex items-center gap-2 text-sm text-dark-5 dark:text-dark-6">
        <input
          type="checkbox"
          name="remember"
          checked={data.remember}
          onChange={handleChange}
          className="accent-primary"
        />
        Keep me signed in on this device
      </label>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-80"
        >
          Sign In
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
