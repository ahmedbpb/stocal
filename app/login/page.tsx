"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup";

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Invalid credentials. Check your email and password.";
  }
  if (lower.includes("password") && lower.includes("6")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (lower.includes("valid email")) {
    return "Please enter a valid email address.";
  }

  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          setError(mapAuthError(signInError.message));
          return;
        }

        router.push("/admin");
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (signUpError) {
          setError(mapAuthError(signUpError.message));
          return;
        }

        if (data.session) {
          router.push("/admin");
          router.refresh();
        } else {
          setInfo("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
          setPassword("");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-black">
              S
            </div>
            <h1
              className="text-3xl font-black tracking-tight"
              style={{
                background:
                  "linear-gradient(180deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Stocal
            </h1>
            <p className="mt-2 text-sm text-white/40">
              {mode === "signin"
                ? "Sign in to your account"
                : "Create your Stocal account"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md">
            {/* Mode toggle */}
            <div className="mb-6 flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mode === "signin"
                    ? "bg-white text-black"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-white text-black"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setInfo(null);
                  }}
                  disabled={loading}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                    setInfo(null);
                  }}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50"
                />
                {mode === "signup" && (
                  <p className="mt-1.5 text-xs text-white/30">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {info && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
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
                  <p className="text-sm text-emerald-300">{info}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-white disabled:hover:text-black"
              >
                {loading ? (
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
                    {mode === "signin" ? "Signing in…" : "Creating account…"}
                  </>
                ) : mode === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/25">
            Stocal · Youth Fashion Marketplace
          </p>
        </div>
      </main>
    </div>
  );
}
