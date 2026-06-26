"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getCartItemCount } from "@/app/cart/actions";
import { getAccountLabel, getAccountPath } from "@/lib/auth/redirects";
import { getProfileForUser } from "@/lib/auth/profile";
import type { UserRole } from "@/lib/auth/roles";
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

const TOUCH_TARGET =
  "inline-flex min-h-11 min-w-11 items-center justify-center";

function isNavLinkActive(pathname: string, href: string) {
  if (href === "/shop/local" || href === "/shop/stocks") {
    return pathname.startsWith(href);
  }
  return pathname === href;
}

function NavLinkItem({
  link,
  active,
  onNavigate,
  className = "",
}: {
  link: NavLink;
  active: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${className} ${
        active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
      }`}
    >
      {link.label}
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const refreshCartCount = useCallback(async () => {
    const count = await getCartItemCount();
    setCartCount(count);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
    if (!user) {
      setUserRole(null);
      return;
    }

    const supabase = createClient();
    getProfileForUser(supabase, user.id).then((profile) => {
      setUserRole(profile?.role ?? "customer");
    });
  }, [user]);

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

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isAuthenticated = Boolean(user);
  const accountHref = isAuthenticated ? getAccountPath(userRole) : "/login";
  const accountLabel = isAuthenticated ? getAccountLabel(userRole) : "Sign In";

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.authOnly || (ready && isAuthenticated),
  );

  const cartLink = ready && isAuthenticated && (
    <Link
      href="/cart"
      aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
      className={`${TOUCH_TARGET} relative rounded-lg transition-colors ${
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
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black text-white">
            S
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            Stocal
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
            <NavLinkItem
              key={link.href}
              link={link}
              active={isNavLinkActive(pathname, link.href)}
            />
          ))}

          {cartLink}

          {ready && (
            <Link
              href={accountHref}
              className={`${TOUCH_TARGET} ml-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white`}
            >
              {accountLabel}
            </Link>
          )}
        </nav>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          {cartLink}

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className={`${TOUCH_TARGET} rounded-lg text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white`}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${menuOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        id="mobile-nav-menu"
        className={`overflow-hidden border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-in-out md:hidden ${
          menuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {visibleLinks.map((link) => (
            <NavLinkItem
              key={link.href}
              link={link}
              active={isNavLinkActive(pathname, link.href)}
              onNavigate={closeMenu}
              className="w-full"
            />
          ))}

          {ready && (
            <Link
              href={accountHref}
              onClick={closeMenu}
              className={`${TOUCH_TARGET} mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white`}
            >
              {accountLabel}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
