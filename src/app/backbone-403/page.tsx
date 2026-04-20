import Link from "next/link";

export default function Backbone403Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-dark-2">
      <div className="w-full max-w-xl rounded-[10px] border border-stroke bg-white p-8 text-center shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Access Denied</p>
        <h1 className="mt-2 text-4xl font-bold text-dark dark:text-white">403 - Forbidden</h1>
        <p className="mt-3 text-sm text-dark-5">
          This is the Next.js replacement for the legacy `BackBone403.aspx` page.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
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
