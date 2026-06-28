"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

type CurrentUser = {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    wallete_balance: number;
};

const CREDIT_PACKAGES = [

    {
        id: 1,
        credits: 100,
        title: "Popular",
        description: "Most selected package",
    },
    {
        id: 2,
        credits: 200,
        title: "Business",
        description: "For growing usage",
    },
    {
        id: 3,
        credits: 500,
        title: "Professional",
        description: "Best for frequent use",
    },
    {
        id: 4,
        credits: 1000,
        title: "Enterprise",
        description: "High-volume credit purchase",
    },
    {
        id: 5,
        credits: 1500,
        title: "Premium",
        description: "High-volume credit purchase",
    },
];

export default function ClientAddCreditPage() {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedCredits, setSelectedCredits] = useState<number>(100);
    const [customCredits, setCustomCredits] = useState("");
    const [useCustomCredits, setUseCustomCredits] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            setLoadingUser(true);
            setError("");

            const response = await axiosInstance.get("/auth/me");
            setUser(response.data);
        } catch (err) {
            console.log(err);
            setError("Unable to load your account information.");
        } finally {
            setLoadingUser(false);
        }
    };

    const parsedCustomCredits = Number(customCredits);

    const getCredits = () => {
        if (useCustomCredits) {
            return parsedCustomCredits;
        }

        return selectedCredits;
    };

    const credits = getCredits();

    const isCustomCreditsValid = useMemo(() => {
        if (!useCustomCredits) return true;
        return !!customCredits && !Number.isNaN(parsedCustomCredits) && parsedCustomCredits > 0;
    }, [useCustomCredits, customCredits, parsedCustomCredits]);

    const totalAmount = useMemo(() => {
        if (!credits || Number.isNaN(credits) || credits <= 0) return 0;
        return credits;
    }, [credits]);

    const userFullName = useMemo(() => {
        const fullName = `${user?.firstname || ""} ${user?.lastname || ""}`.trim();
        return fullName || user?.username || "Account User";
    }, [user]);

    const userInitials = useMemo(() => {
        const first = user?.firstname?.[0] || "";
        const last = user?.lastname?.[0] || "";
        const combined = `${first}${last}`.trim();
        return combined ? combined.toUpperCase() : (user?.username?.[0] || "U").toUpperCase();
    }, [user]);

    const handleSelectPackage = (packageCredits: number) => {
        setSelectedCredits(packageCredits);
        setUseCustomCredits(false);
        setCustomCredits("");
    };

    const handleContinue = async () => {
        const selected = getCredits();

        if (!selected || selected <= 0 || Number.isNaN(selected)) {
            alert("Please select valid credits.");
            return;
        }

        try {
            setProcessing(true);

            const response = await axiosInstance.post(
                "/masters/transaction/paypal/create",
                {
                    credits: selected,
                }
            );

            if (!response.data?.approvalUrl) {
                throw new Error("Approval URL missing.");
            }

            window.location.href = response.data.approvalUrl;
        } catch (err: any) {
            console.log(err);

            alert(
                err?.response?.data?.message ||
                "Unable to create PayPal payment."
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="rounded-2xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="border-b border-stroke px-6 py-5 dark:border-dark-3 sm:px-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-dark dark:text-white">
                            Purchase Credits
                        </h1>
                        <p className="mt-1 text-sm text-dark-5">
                            Add wallet credits securely using PayPal and continue without interruption.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary dark:border-primary/30 dark:bg-primary/15">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Secure Checkout
                    </div>
                </div>
            </div>

            {loadingUser ? (
                <div className="p-6 sm:p-8">
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                            <div className="animate-pulse">
                                <div className="mb-5 flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gray-2 dark:bg-dark-3" />
                                    <div className="flex-1">
                                        <div className="h-4 w-40 rounded bg-gray-2 dark:bg-dark-3" />
                                        <div className="mt-3 h-3 w-56 rounded bg-gray-2 dark:bg-dark-3" />
                                    </div>
                                </div>
                                <div className="h-20 rounded-2xl bg-gray-2 dark:bg-dark-3" />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 w-32 rounded bg-gray-2 dark:bg-dark-3" />
                                <div className="h-12 rounded-xl bg-gray-2 dark:bg-dark-3" />
                                <div className="h-12 rounded-xl bg-gray-2 dark:bg-dark-3" />
                                <div className="h-12 rounded-xl bg-gray-2 dark:bg-dark-3" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 sm:p-8">
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-2xl border border-stroke bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:border-dark-3">
                                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg">
                                            {userInitials}
                                        </div>

                                        <div>
                                            <div className="text-xs font-medium uppercase tracking-[0.18em] text-dark-5">
                                                Logged in account
                                            </div>
                                            <div className="mt-1 text-xl font-semibold text-dark dark:text-white">
                                                {userFullName}
                                            </div>
                                            <div className="mt-1 text-sm text-dark-5">
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-primary/15 bg-white/80 px-5 py-4 backdrop-blur-sm dark:border-primary/20 dark:bg-dark-2/80">
                                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-dark-5">
                                            Current Wallet Balance
                                        </div>
                                        <div className="mt-2 text-3xl font-bold text-primary [font-variant-numeric:tabular-nums]">
                                            {Number(user?.wallete_balance || 0).toFixed(2)}
                                        </div>
                                        <div className="mt-1 text-sm text-dark-5">
                                            Available credits
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                                <div className="mb-5 flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-dark dark:text-white">
                                            Select Credit Package
                                        </h2>
                                        <p className="mt-1 text-sm text-dark-5">
                                            Choose a package or switch to custom credits.
                                        </p>
                                    </div>

                                    <div className="hidden rounded-full bg-gray-1 px-3 py-1 text-xs font-medium text-dark-5 dark:bg-dark-3 sm:block">
                                        1 Credit = $1.00
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {CREDIT_PACKAGES.map((pkg) => {
                                        const isActive =
                                            !useCustomCredits && selectedCredits === pkg.credits;
                                        const isPopular = pkg.title === "Popular";

                                        return (
                                            <button
                                                key={pkg.id}
                                                type="button"
                                                onClick={() => handleSelectPackage(pkg.credits)}
                                                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ${isActive
                                                    ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "border-stroke bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-dark-3 dark:bg-gray-dark"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div
                                                            className={`text-sm font-semibold ${isActive ? "text-white" : "text-dark dark:text-white"
                                                                }`}
                                                        >
                                                            {pkg.title}
                                                        </div>
                                                        <div
                                                            className={`mt-1 text-xs ${isActive ? "text-white/80" : "text-dark-5"
                                                                }`}
                                                        >
                                                            {pkg.description}
                                                        </div>
                                                    </div>

                                                    {isPopular && (
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive
                                                                ? "bg-white/15 text-white"
                                                                : "bg-primary/10 text-primary"
                                                                }`}
                                                        >
                                                            Popular
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-6 flex items-end justify-between">
                                                    <div>
                                                        <div
                                                            className={`text-3xl font-bold [font-variant-numeric:tabular-nums] ${isActive ? "text-white" : "text-primary"
                                                                }`}
                                                        >
                                                            {pkg.credits}
                                                        </div>
                                                        <div
                                                            className={`mt-1 text-xs ${isActive ? "text-white/80" : "text-dark-5"
                                                                }`}
                                                        >
                                                            Credits
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`text-sm font-semibold ${isActive ? "text-white" : "text-dark dark:text-white"
                                                            }`}
                                                    >
                                                        ${pkg.credits.toFixed(2)}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* <div className="rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-dark dark:text-white">
                                            Custom Credits
                                        </h2>
                                        <p className="mt-1 text-sm text-dark-5">
                                            Enable this only if you want a custom credit amount.
                                        </p>
                                    </div>

                                    <label className="inline-flex cursor-pointer items-center gap-3 self-start rounded-full border border-stroke bg-gray-1 px-3 py-2 dark:border-dark-3 dark:bg-dark-3">
                                        <input
                                            type="checkbox"
                                            checked={useCustomCredits}
                                            onChange={(e) => setUseCustomCredits(e.target.checked)}
                                            className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-dark dark:text-white">
                                            Use custom credits
                                        </span>
                                    </label>
                                </div>

                                <div className="mt-5">
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Enter custom credits"
                                        value={customCredits}
                                        disabled={!useCustomCredits}
                                        onChange={(e) => setCustomCredits(e.target.value)}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${useCustomCredits
                                            ? "border-stroke bg-white focus:border-primary dark:border-dark-3 dark:bg-gray-dark"
                                            : "cursor-not-allowed border-stroke bg-gray-1 text-dark-5 dark:border-dark-3 dark:bg-dark-3"
                                            }`}
                                    />
                                    {useCustomCredits && !isCustomCreditsValid && customCredits !== "" && (
                                        <p className="mt-2 text-sm text-red-500">
                                            Please enter a valid credit amount greater than 0.
                                        </p>
                                    )}
                                </div>
                            </div> */}

                            {error && (
                                <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="h-fit rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2 xl:sticky xl:top-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-dark dark:text-white">
                                        Payment Summary
                                    </h2>
                                    <p className="mt-1 text-sm text-dark-5">
                                        Review your selected credits before checkout.
                                    </p>
                                </div>

                                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    PayPal
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="rounded-xl border border-stroke bg-gray-1 p-4 dark:border-dark-3 dark:bg-gray-dark">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-dark-5">Selected credits</span>
                                        <span className="text-base font-semibold text-dark dark:text-white [font-variant-numeric:tabular-nums]">
                                            {credits && !Number.isNaN(credits) ? credits : 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-stroke bg-gray-1 p-4 dark:border-dark-3 dark:bg-gray-dark">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-dark-5">Rate</span>
                                        <span className="text-base font-semibold text-dark dark:text-white">
                                            $1.00 / credit
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-stroke bg-gray-1 p-4 dark:border-dark-3 dark:bg-gray-dark">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-dark-5">Amount (USD)</span>
                                        <span className="text-base font-semibold text-dark dark:text-white [font-variant-numeric:tabular-nums]">
                                            ${totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="my-6 h-px bg-stroke dark:bg-dark-3" />

                            <div className="rounded-2xl bg-primary px-5 py-4 text-white">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium text-white/85">Total Payable</span>
                                    <span className="text-3xl font-bold [font-variant-numeric:tabular-nums]">
                                        ${totalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={handleContinue}
                                    disabled={processing || !credits || credits <= 0 || Number.isNaN(credits)}
                                    className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? "Redirecting to PayPal..." : "Proceed to PayPal"}
                                </button>

                                <p className="text-center text-xs leading-5 text-dark-5">
                                    You will be redirected to PayPal to complete this transaction securely.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}