"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/components/Auth/AuthProvider";
import Link from "next/link";
import Image from "next/image";

const getDisplayName = (firstname?: string | null, lastname?: string | null) => {
  const fullName = `${firstname ?? ""} ${lastname ?? ""}`.trim();
  return fullName || "Backbone User";
};

export default function Page() {
  const { user, isLoading } = useAuth();
  const displayName = getDisplayName(user?.firstname, user?.lastname);
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Profile" />

      <div className="overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="relative h-35 md:h-52">
          {/* <Image
            src="/images/cover/cover-01.png"
            alt="profile cover"
            fill
            className="object-cover"
          /> */}
        </div>

        <div className="px-4 pb-8 pt-0 sm:px-8">
          <div className="relative -mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-primary text-2xl font-bold text-white shadow-lg dark:border-gray-dark">
                {initials || "BU"}
              </div>

              <div className="pb-2">
                <h2 className="text-2xl font-semibold text-dark dark:text-white">
                  {isLoading ? "Loading profile..." : displayName}
                </h2>
                <p className="text-sm text-dark-5">
                  {user?.role || "User"} • {user?.status || "Active"}
                </p>
              </div>
            </div>

            <Link
              href="/pages/settings"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Edit Profile & Password
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-dark-5">User Name</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {user?.username || "—"}
              </p>
            </div>

            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-dark-5">Email</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {user?.email || "—"}
              </p>
            </div>

            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-dark-5">Mobile</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {user?.mobileno || "—"}
              </p>
            </div>

            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-dark-5">Company Name</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {user?.companyname || "—"}
              </p>
            </div>

            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-dark-5">Office Number</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {user?.officeno || "—"}
              </p>
            </div>

            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-dark-5">Location</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {[user?.city, user?.state, user?.zipcode].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <h3 className="mb-2 text-base font-semibold text-dark dark:text-white">
                Address
              </h3>
              <p className="text-sm text-dark-5">
                {user?.address || "No address added yet."}
              </p>
            </div>

            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <h3 className="mb-2 text-base font-semibold text-dark dark:text-white">
                Standard Instruction
              </h3>
              <p className="text-sm text-dark-5">
                {user?.std_instr || "No standard instruction added yet."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
