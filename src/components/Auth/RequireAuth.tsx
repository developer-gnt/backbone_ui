"use client";

import { useAuth } from "@/components/Auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const nextPath =
        pathname && pathname !== "/"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";

      router.replace(`/auth/sign-in${nextPath}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-lg bg-white px-4 py-3 text-sm text-dark shadow-1 dark:bg-gray-dark dark:text-white">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
