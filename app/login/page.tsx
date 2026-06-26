import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
