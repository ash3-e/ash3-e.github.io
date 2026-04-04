"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbox } from "@/components/lightbox";
import type { SliderItem } from "@/lib/content";

export function SliderModule({ heading, items }: { heading: string; items: SliderItem[] }) {
  const safeItems = useMemo(
    () =>
      items.length > 0
        ? items
        : [
            {
              key: "placeholder",
              title: "Add content",
              body: "This slider is ready for content. Add image and text files in the local content tree or replace them in admin mode.",
              imagePath: ""
            }
          ],
    [items]
  );
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const active = safeItems[index];

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((value) => (value + 1) % safeItems.length);
    }, 60000);
    return () => window.clearInterval(id);
  }, [safeItems.length]);

  useEffect(() => {
    setIndex(0);
  }, [safeItems.length]);

  return (
    <>
      <section className="slider-shell" aria-label={heading}>
        <div className="slider-stage">
          {safeItems.length > 1 ? (
            <div className="slider-nav" aria-label="Slide navigation">
              <button
                type="button"
                className="icon-button slider-arrow"
                onClick={() => setIndex((value) => (value - 1 + safeItems.length) % safeItems.length)}
                aria-label="Previous slide"
              >
                <img src="/icons/arrowleft.svg" alt="" />
              </button>
              <button
                type="button"
                className="icon-button slider-arrow"
                onClick={() => setIndex((value) => (value + 1) % safeItems.length)}
                aria-label="Next slide"
              >
                <img src="/icons/arrowright.svg" alt="" />
              </button>
            </div>
          ) : null}

          <div className="slider-viewport">
            <div className="slider-stage-track" style={{ transform: `translateX(-${index * 100}%)` }}>
              {safeItems.map((item) => (
                <article key={item.key} className="slider-stage-frame">
                  <div className="slider-frame">
                    <div className="slider-visual">
                      {item.imagePath ? (
                        <button type="button" onClick={() => setOpen(true)} aria-label={`Open ${item.title} preview`}>
                          <img src={item.imagePath} alt={item.title} />
                        </button>
                      ) : (
                        <button type="button" onClick={() => null} aria-label="Placeholder slide">
                          <div className="empty-state" style={{ height: "100%" }}>No image file detected yet.</div>
                        </button>
                      )}
                    </div>
                    <div className="slider-copy">
                      <div className="slider-step">{heading}</div>
                      <div className="module-copy stack">
                        <h3>{item.title}</h3>
                        {item.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, paragraphIndex) => (
                          <p key={`${item.key}-${paragraphIndex}`}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {safeItems.length > 1 ? (
          <div className="slider-indicators" role="tablist" aria-label="Slide selector">
            {safeItems.map((item, itemIndex) => (
              <button
                key={item.key}
                type="button"
                className="slider-indicator"
                aria-label={`Go to ${item.title}`}
                data-active={itemIndex === index}
                aria-selected={itemIndex === index}
                onClick={() => setIndex(itemIndex)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {open && active.imagePath ? <Lightbox title={active.title} src={active.imagePath} alt={active.title} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
