"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type CheckoutSession = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  contact: string;
  name: string;
  product: string;
  email: string;
};

export default function BackboneCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const openedRef = useRef(false);

  const query = useMemo(() => {
    const amountText = searchParams.get("Amount")?.trim() ?? "0";
    const amount = Number(amountText);

    return {
      amount,
      contact: searchParams.get("Contact")?.trim() ?? "",
      name: searchParams.get("Name")?.trim() ?? "Backbone Data Solutions",
      product: searchParams.get("Product")?.trim() ?? "Checkout Payment",
      email: searchParams.get("Email")?.trim() ?? "",
    };
  }, [searchParams]);

  useEffect(() => {
    const createOrder = async () => {
      if (!Number.isFinite(query.amount) || query.amount <= 0) {
        setError("A valid Amount query parameter is required before checkout can open.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.post("/masters/transaction/checkout-order", {
          amount: query.amount,
          contact: query.contact,
          name: query.name,
          product: query.product,
          email: query.email,
        });

        setSession(response.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to prepare the checkout session."));
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    void createOrder();
  }, [query.amount, query.contact, query.email, query.name, query.product]);

  const openCheckout = () => {
    if (!scriptReady || !session || openedRef.current) {
      return;
    }

    const RazorpayCtor = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;

    if (!RazorpayCtor) {
      setError("The Razorpay checkout script did not load correctly.");
      return;
    }

    openedRef.current = true;
    setLaunching(true);

    const checkout = new RazorpayCtor({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency || "INR",
      name: session.name,
      description: session.product,
      order_id: session.orderId,
      image: "https://razorpay.com/favicon.png",
      prefill: {
        name: session.name,
        email: session.email,
        contact: session.contact,
      },
      theme: {
        color: "#F37254",
      },
      modal: {
        ondismiss: () => {
          openedRef.current = false;
          setLaunching(false);
        },
      },
      handler: (response: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      }) => {
        const nextParams = new URLSearchParams({
          razorpay_order_id: response.razorpay_order_id ?? "",
          razorpay_payment_id: response.razorpay_payment_id ?? "",
          razorpay_signature: response.razorpay_signature ?? "",
          amount: String(query.amount),
          product: session.product,
          name: session.name,
          email: session.email,
        });

        router.replace(`/payment-success?${nextParams.toString()}`);
      },
    });

    checkout.open();
  };

  useEffect(() => {
    if (!loading && !error && scriptReady && session) {
      openCheckout();
    }
  }, [error, loading, scriptReady, session]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-dark-2">
        <div className="mx-auto max-w-2xl rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <div className="mb-6">
            <p className="text-sm font-medium text-primary">Public Payment Page</p>
            <h1 className="text-2xl font-semibold text-dark dark:text-white">Backbone Checkout</h1>
            <p className="mt-1 text-sm text-dark-5">
              This page mirrors the legacy `BackBone_Checkout.aspx` Razorpay payment flow.
            </p>
          </div>

          <div className="grid gap-4 rounded-lg bg-gray-1 p-4 text-sm dark:bg-dark-2 sm:grid-cols-2">
            <div>
              <div className="text-dark-5">Amount</div>
              <div className="font-semibold text-dark dark:text-white">₹ {Number.isFinite(query.amount) ? query.amount.toFixed(2) : "0.00"}</div>
            </div>
            <div>
              <div className="text-dark-5">Product</div>
              <div className="font-semibold text-dark dark:text-white">{query.product || "-"}</div>
            </div>
            <div>
              <div className="text-dark-5">Customer</div>
              <div className="font-semibold text-dark dark:text-white">{query.name || "-"}</div>
            </div>
            <div>
              <div className="text-dark-5">Email</div>
              <div className="font-semibold text-dark dark:text-white">{query.email || "-"}</div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4">
              {error}
            </div>
          )}

          {!error && (
            <div className="mt-5 rounded-lg border border-stroke px-4 py-3 text-sm text-dark-5 dark:border-dark-3">
              {loading
                ? "Preparing the Razorpay session..."
                : launching
                  ? "Opening the Razorpay popup..."
                  : "If the popup was blocked, use the button below to launch it again."}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCheckout}
              disabled={loading || !scriptReady || !session}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Preparing..." : "Pay with Razorpay"}
            </button>

            <Link
              href="/auth/sign-in"
              className="rounded-lg border border-stroke px-5 py-2 text-sm font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
