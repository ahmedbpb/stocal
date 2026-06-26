"use client";

import { useSearchParams } from "next/navigation";
import {
  UNAUTHORIZED_QUERY,
  UNAUTHORIZED_VALUE,
} from "@/lib/auth/redirects";

export function UnauthorizedNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get(UNAUTHORIZED_QUERY) !== UNAUTHORIZED_VALUE) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mx-4 mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200 sm:mx-6"
    >
      You don&apos;t have permission to access that page.
    </div>
  );
}
