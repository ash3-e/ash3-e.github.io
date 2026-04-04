"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeButton } from "@/components/home-button";

const PAGE_META = {
  gyre: { title: "Gyre", description: "Systems, cycles, and durable service structures." },
  emblazon: { title: "Emblazon", description: "Maker works, visual identity, and art direction." },
  trillium: { title: "Trillium", description: "Landscape-minded experiences and grounded storytelling." }
} as const;

type SubsidiarySlug = keyof typeof PAGE_META;

export function QuickJump({ current }: { current: SubsidiarySlug }) {
  const destinations = useMemo(() => (Object.keys(PAGE_META) as SubsidiarySlug[]).filter((slug) => slug !== current), [current]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOffset((value) => (value + 1) % destinations.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [destinations.length]);

  const ordered = destinations.map((_, index) => destinations[(index + offset) % destinations.length]);

  return (
    <div className="quick-jump" aria-label="Rotating quick jump">
      <div className="quick-jump-small">
        {ordered.map((slug) => (
          <Link href={`/${slug}`} key={slug} className="quick-jump-chip">
            <span>
              <strong>{PAGE_META[slug].title}</strong>
              <span>{PAGE_META[slug].description}</span>
            </span>
          </Link>
        ))}
      </div>
      <HomeButton />
    </div>
  );
}
