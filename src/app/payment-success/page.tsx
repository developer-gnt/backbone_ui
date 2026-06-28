"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();

  const status =
    searchParams.get("status") || "success";

  const success = status === "success";
  const cancelled = status === "cancel";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-dark-2">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">

        <div
          className={`p-8 text-center text-white ${success
            ? "bg-green-600"
            : cancelled
              ? "bg-yellow-500"
              : "bg-red-600"
            }`}
        >
          <div className="mb-4 text-6xl">
            {success ? "✅" : cancelled ? "⚠️" : "❌"}
          </div>

          <h1 className="text-3xl font-bold">
            {success
              ? "Payment Successful"
              : cancelled
                ? "Payment Cancelled"
                : "Payment Failed"}
          </h1>
        </div>

        <div className="space-y-6 p-8">

          {success && (
            <>
              <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-800">
                <h2 className="mb-2 text-lg font-semibold">
                  Credits Added Successfully
                </h2>

                <p>
                  Thank you for purchasing credits.
                </p>

                <p className="mt-2">
                  Your payment has been successfully processed.
                </p>

                <p className="mt-2">
                  Your wallet balance has been updated and is now available for placing new appraisal orders.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="font-semibold text-blue-800">
                  What's Next?
                </h3>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-blue-700">
                  <li>Your wallet has been updated.</li>
                  <li>The transaction has been recorded.</li>
                  <li>A confirmation email has been sent.</li>
                  <li>You can now use your credits immediately.</li>
                </ul>
              </div>
            </>
          )}

          {cancelled && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800">
              <h2 className="mb-2 text-lg font-semibold">
                Payment Cancelled
              </h2>

              <p>
                Your payment was cancelled before completion.
              </p>

              <p className="mt-2">
                No credits were added to your wallet.
              </p>
            </div>
          )}

          {!success && !cancelled && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
              <h2 className="mb-2 text-lg font-semibold">
                Payment Failed
              </h2>

              <p>
                We couldn't complete your payment.
              </p>

              <p className="mt-2">
                No credits were added to your wallet.
              </p>

              <p className="mt-2">
                Please try again or contact support if the problem continues.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-stroke bg-gray-50 p-5 dark:border-dark-3 dark:bg-dark-2">
            <h3 className="mb-3 font-semibold">
              Need Help?
            </h3>

            <p className="text-sm text-dark-5">
              If your credits do not appear in your account within a few
              minutes, please contact Backbone Data Solutions Support.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">

            <Link
              href="/client/add-credit"
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-center font-medium text-white hover:bg-primary/90"
            >
              Go to Credit page
            </Link>

            <Link
              href="/orders/place-new-order"
              className="flex-1 rounded-xl border border-stroke px-5 py-3 text-center font-medium hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2"
            >
              Place New Order
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}