import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";

export default function ProductNotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl font-black text-white/20">404</p>
        <h1 className="mt-4 text-2xl font-bold">Product not found</h1>
        <p className="mt-2 max-w-sm text-sm text-white/40">
          This listing may have been removed or is not yet approved for the
          shop.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-xl bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
