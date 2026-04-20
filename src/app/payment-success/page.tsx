"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type VerificationResult = {
  verified: boolean;
  orderId: string;
  paymentId: string;
};

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const payload = useMemo(
    () => ({
      orderId: searchParams.get("razorpay_order_id")?.trim() ?? "",
      paymentId: searchParams.get("razorpay_payment_id")?.trim() ?? "",
      signature: searchParams.get("razorpay_signature")?.trim() ?? "",
      amount: searchParams.get("amount")?.trim() ?? "",
      product: searchParams.get("product")?.trim() ?? "Checkout Payment",
      name: searchParams.get("name")?.trim() ?? "Customer",
      email: searchParams.get("email")?.trim() ?? "",
    }),
    [searchParams],
  );

  useEffect(() => {
    const verify = async () => {
      if (!payload.orderId || !payload.paymentId || !payload.signature) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.post("/masters/transaction/checkout-verify", {
          razorpay_order_id: payload.orderId,
          razorpay_payment_id: payload.paymentId,
          razorpay_signature: payload.signature,
        });

        if (!response.data?.verified) {
          setError("Payment callback was received, but signature verification failed.");
          setResult(response.data ?? null);
          return;
        }

        setResult(response.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to verify the payment callback."));
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [payload.orderId, payload.paymentId, payload.signature]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-dark-2">
      <div className="mx-auto max-w-2xl rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <p className="text-sm font-medium text-primary">Payment Callback</p>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Payment Success</h1>
        <p className="mt-1 text-sm text-dark-5">
          This page is the Next.js replacement for the legacy `PaymentSuccess.aspx` handoff.
        </p>

        <div className="mt-6 grid gap-4 rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2 sm:grid-cols-2">
          <div>
            <div className="text-dark-5">Amount</div>
            <div className="font-semibold text-dark dark:text-white">₹ {payload.amount || "-"}</div>
          </div>
          <div>
            <div className="text-dark-5">Product</div>
            <div className="font-semibold text-dark dark:text-white">{payload.product || "-"}</div>
          </div>
          <div>
            <div className="text-dark-5">Customer</div>
            <div className="font-semibold text-dark dark:text-white">{payload.name || "-"}</div>
          </div>
          <div>
            <div className="text-dark-5">Email</div>
            <div className="font-semibold text-dark dark:text-white">{payload.email || "-"}</div>
          </div>
        </div>

        {loading && (
          <div className="mt-5 rounded-lg border border-stroke px-4 py-3 text-sm text-dark-5 dark:border-dark-3">
            Verifying the Razorpay callback...
          </div>
        )}

        {!loading && result?.verified && (
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4">
            Payment verified successfully. Payment ID: <span className="font-semibold">{result.paymentId}</span>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-2 text-sm text-dark-5">
          <p><span className="font-medium text-dark dark:text-white">Order ID:</span> {payload.orderId || "-"}</p>
          <p><span className="font-medium text-dark dark:text-white">Payment ID:</span> {payload.paymentId || "-"}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/sign-in"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-stroke px-5 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
