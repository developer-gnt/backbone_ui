"use client";

import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";

type PackageOption = {
  packageId: number | string;
  packageCode?: string;
  displayLabel?: string;
  tatHours?: number | string;
  defaultPrice?: number | string;
  effectivePrice?: number | string;
  isOverridden?: boolean;
};

const formatAmount = (value?: number | string | null) => Number(value ?? 0).toFixed(0);

export default function ClientPricingPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get("/tat-packages", {
          params: {
            username: user?.username || user?.email || undefined,
          },
        });

        setPackages(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setPackages([]);
        setError(getApiErrorMessage(err, "Unable to load pricing packages."));
      } finally {
        setLoading(false);
      }
    };

    void loadPackages();
  }, [user?.email, user?.username]);

  const trialInfo = useMemo(() => {
    const expiry = user?.expiry_date ? new Date(user.expiry_date) : null;

    if (!expiry || Number.isNaN(expiry.getTime())) {
      return { active: false, daysRemaining: 0 };
    }

    const diffMs = expiry.getTime() - Date.now();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const freeTrialFlag = `${user?.free_trial ?? ""}`.trim().toLowerCase();
    const active = daysRemaining > 0 && ["on", "yes", "true"].includes(freeTrialFlag);

    return { active, daysRemaining };
  }, [user?.expiry_date, user?.free_trial]);

  const trialPackage = packages.find((item) => `${item.tatHours ?? item.displayLabel ?? ""}`.includes("12")) || packages[0];

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Pricing Packages</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:text-white">
            Standard Packages
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-1 dark:bg-dark-2">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Pricing</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Order Now</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-dark-5">Loading packages...</td>
                  </tr>
                ) : packages.length ? (
                  packages.map((item, index) => (
                    <tr key={item.packageId} className="border-t border-stroke dark:border-dark-3">
                      <td className="px-4 py-3">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-3">
                        {formatAmount(item.effectivePrice ?? item.defaultPrice)} Credits
                      </td>
                      <td className="px-4 py-3">{item.displayLabel || `${item.tatHours || "—"} hours TAT`}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/client/new-order?package=${item.packageId}`}
                          className="rounded-md bg-green px-3 py-1 text-xs font-medium text-white hover:bg-green/90"
                        >
                          Place Order Now
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-dark-5">No pricing packages found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-stroke dark:border-dark-3">
          <div className="border-b border-stroke px-4 py-3 font-semibold text-dark dark:border-dark-3 dark:text-white">
            FREE TRIALS
            {trialInfo.active && (
              <span className="ml-2 text-sm font-normal text-primary">
                [{trialInfo.daysRemaining} days remaining to avail free trial]
              </span>
            )}
          </div>

          {trialInfo.active ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-1 dark:bg-dark-2">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Pricing</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Order Now</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map((index) => (
                    <tr key={index} className="border-t border-stroke dark:border-dark-3">
                      <td className="px-4 py-3">0{index}</td>
                      <td className="px-4 py-3">12 Credits</td>
                      <td className="px-4 py-3">12 hours TAT</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/client/new-order?package=${trialPackage?.packageId ?? ""}&status=free`}
                          className="rounded-md bg-green px-3 py-1 text-xs font-medium text-white hover:bg-green/90"
                        >
                          Place Order Now
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm font-medium text-red-600 dark:text-red-light-4">
              YOUR FREE TRIAL EXPIRED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
