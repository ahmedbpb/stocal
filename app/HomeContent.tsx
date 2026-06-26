"use client";

import Link from "next/link";
import { Suspense } from "react";
import { UnauthorizedNotice } from "@/components/UnauthorizedNotice";
import { ShopByCategory } from "@/components/shop-by-category";

type HomeContentProps = {
  categories: string[];
};

type HeroCard = {
  href: string;
  label: string;
  title: string;
  description: string;
  cta: string;
  bg: string;
  accent: string;
  descriptionColor: string;
  texture: string;
};

const HERO_CARDS: HeroCard[] = [
  {
    href: "/browse?type=local_brand",
    label: "Independent · Street · Raw",
    title: "Local Brands",
    description: "Homegrown labels and the next wave of youth fashion",
    cta: "Enter Local Brands",
    bg: "#0d0818",
    accent: "#7c3aed",
    descriptionColor: "#a78bfa",
    texture:
      "radial-gradient(ellipse at top left, rgba(124,58,237,0.15) 0%, transparent 60%)",
  },
  {
    href: "/browse?type=stock_seller",
    label: "Verified · Premium · Authentic",
    title: "Original Stock",
    description:
      "Curated pieces from established labels, authenticated and inspected",
    cta: "Enter Original Stock",
    bg: "#0f0a00",
    accent: "#d97706",
    descriptionColor: "#fbbf24",
    texture:
      "radial-gradient(ellipse at top right, rgba(217,119,6,0.15) 0%, transparent 60%)",
  },
  {
    href: "/community",
    label: "Share · Discuss · Inspire",
    title: "Community",
    description: "Share your fits, get opinions, and connect with the culture",
    cta: "Join the Conversation",
    bg: "#000f0f",
    accent: "#0891b2",
    descriptionColor: "#67e8f9",
    texture:
      "radial-gradient(ellipse at bottom, rgba(8,145,178,0.15) 0%, transparent 60%)",
  },
];

export default function HomeContent({ categories }: HomeContentProps) {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col">
        <Suspense fallback={null}>
          <UnauthorizedNotice />
        </Suspense>

        <section className="grid flex-1 grid-cols-1 md:grid-cols-3">
          {HERO_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex min-h-[50vh] flex-col justify-end overflow-hidden border-t-2 p-10 md:min-h-[70vh] md:p-14"
              style={{
                backgroundColor: card.bg,
                borderTopColor: card.accent,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: card.texture }}
              />

              <div className="relative">
                <p
                  className="mb-4 text-xs uppercase tracking-[0.2em]"
                  style={{ color: card.accent }}
                >
                  {card.label}
                </p>
                <h2 className="mb-4 text-5xl font-bold leading-tight text-white md:text-6xl">
                  {card.title}
                </h2>
                <p
                  className="mb-8 max-w-xs text-sm leading-relaxed md:text-base"
                  style={{ color: card.descriptionColor }}
                >
                  {card.description}
                </p>
                <span
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: card.accent }}
                >
                  <span className="group-hover:underline">{card.cta}</span>
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </section>

        <ShopByCategory categories={categories} />
      </main>
    </div>
  );
}
