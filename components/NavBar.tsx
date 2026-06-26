"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getCartItemCount } from "@/app/cart/actions";
import { CART_UPDATED_EVENT } from "@/lib/cart/types";
import { createClient } from "@/lib/supabase/client";

type NavLink = {
  href: string;
  label: string;
  authOnly?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/shop/local", label: "Local Brands" },
  { href: "/shop/stocks", label: "Original Stocks" },
  { href: "/orders", label: "My Orders", authOnly: true },
];

function isNavLinkActive(pathname: string, href: string) {
  if (href === "/shop/local" || href === "/shop/stocks") {
    return pathname.startsWith(href);
  }
  return pathname === href;
}

export function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    const count = await getCartItemCount();
    setCartCount(count);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setCartCount(0);
      return;
    }

    refreshCartCount();
  }, [ready, user, pathname, refreshCartCount]);

  useEffect(() => {
    const handleCartUpdated = () => {
      refreshCartCount();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () =>
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
  }, [refreshCartCount]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isAuthenticated = Boolean(user);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black text-white">
            S
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            Stocal
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            if (link.authOnly && ready && !isAuthenticated) return null;

            const active = isNavLinkActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors sm:text-sm sm:normal-case sm:tracking-normal ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {ready && isAuthenticated && (
            <Link
              href="/cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className={`relative rounded-lg px-3 py-2 transition-colors ${
                pathname === "/cart"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {ready && (
            <Link
              href={isAuthenticated ? "/admin" : "/login"}
              className="ml-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white sm:ml-2"
            >
              {isAuthenticated ? "Account" : "Sign In"}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
