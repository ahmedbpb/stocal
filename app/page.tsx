"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UnauthorizedNotice } from "@/components/UnauthorizedNotice";

type FormStatus = "idle" | "loading" | "success" | "invalid" | "error" | "duplicate";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("invalid");
      return;
    }

    setStatus("loading");

    const { error } = await supabase.from("waitlist").insert({ email: trimmed });

    if (error) {
      if (error.code === "23505") {
        setStatus("duplicate");
      } else {
        setStatus("error");
      }
      return;
    }

    setEmail("");
    setStatus("success");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative z-10 flex min-h-[calc(100vh-3.5rem)] flex-col">
        <Suspense fallback={null}>
          <UnauthorizedNotice />
        </Suspense>
        {/* Split gateway hero */}
        <section className="grid flex-1 grid-cols-1 md:grid-cols-2">
          <Link
            href="/shop/local"
            className="group relative flex min-h-[45vh] flex-col justify-end overflow-hidden border-b border-white/[0.06] p-8 sm:p-12 md:min-h-0 md:border-b-0 md:border-r"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-950/80 via-violet-950/60 to-[#0a0a0a]" />
            <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-[100px] transition-all duration-700 group-hover:bg-fuchsia-500/40" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 bg-[radial-gradient(circle,rgba(236,72,153,0.15)_0%,transparent_70%)]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.12]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(236,72,153,0.3) 20px, rgba(236,72,153,0.3) 21px)",
              }}
            />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300/70">
                Independent · Street · Raw
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Local
                <br />
                <span className="bg-gradient-to-r from-white to-fuchsia-300 bg-clip-text text-transparent">
                  Brands
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                Homegrown labels, underground drops, and the next wave of youth
                fashion — straight from the creators.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-fuchsia-300 transition-all group-hover:gap-4">
                Enter Local Brands
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </div>
          </Link>

          <Link
            href="/shop/stocks"
            className="group relative flex min-h-[45vh] flex-col justify-end overflow-hidden p-8 sm:p-12 md:min-h-0"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-amber-950/70 via-neutral-950/80 to-[#0a0a0a]" />
            <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-amber-500/20 blur-[100px] transition-all duration-700 group-hover:bg-amber-400/30" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_70%)]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(251,191,36,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.15) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">
                Verified · Premium · Authentic
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Original
                <br />
                <span className="bg-gradient-to-r from-white to-amber-300 bg-clip-text text-transparent">
                  Stocks
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                Curated pieces from established labels — authenticated,
                inspected, and ready for your rotation.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-300 transition-all group-hover:gap-4">
                Enter Original Stocks
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </div>
          </Link>
        </section>

        {/* Brand mark + waitlist */}
        <section className="mx-auto w-full max-w-md px-6 py-16">
          <div className="mb-10 text-center">
            <p
              className="text-3xl font-black tracking-tighter"
              style={{
                background:
                  "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.35) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Stocal
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/30">
              Youth Fashion Marketplace
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md">
            {status === "success" ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30">
                  <svg
                    className="h-7 w-7 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-white">
                  You&apos;re on the list!
                </p>
                <p className="mt-2 text-sm text-white/40">
                  We&apos;ll reach out when Stocal drops. Stay tuned.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                  Join the Waitlist
                </h2>
                <p className="mt-2 text-center text-sm text-white/40">
                  Be first to access drops from the best local brands.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle" && status !== "loading") {
                        setStatus("idle");
                      }
                    }}
                    disabled={status === "loading"}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    {status === "loading" ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </form>

                {status === "invalid" && (
                  <p className="mt-4 text-center text-sm text-red-400">
                    Please enter a valid email address.
                  </p>
                )}
                {status === "error" && (
                  <p className="mt-4 text-center text-sm text-red-400">
                    Something went wrong. Please try again.
                  </p>
                )}
                {status === "duplicate" && (
                  <p className="mt-4 text-center text-sm text-amber-400">
                    This email is already on the waitlist.
                  </p>
                )}
              </>
            )}
          </div>

          <footer className="mt-10 text-center text-xs text-white/20">
            © {new Date().getFullYear()} Stocal. All rights reserved.
          </footer>
        </section>
      </main>
    </div>
  );
}
