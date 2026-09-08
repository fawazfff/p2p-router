"use client";

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    document.documentElement.classList.add("motion-ready");

    if (reduceMotion.matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return () => document.documentElement.classList.remove("motion-ready");
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -7%" });

    revealItems.forEach((item) => observer.observe(item));

    const hero = document.querySelector<HTMLElement>(".hero-product");
    const preview = document.querySelector<HTMLElement>(".preview-front");
    const move = (event: PointerEvent) => {
      if (!hero || !preview || event.pointerType === "touch") return;
      const box = hero.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      preview.style.setProperty("--tilt-x", `${x * 1.8}deg`);
      preview.style.setProperty("--tilt-y", `${y * 8}px`);
    };
    const reset = () => {
      preview?.style.setProperty("--tilt-x", "0deg");
      preview?.style.setProperty("--tilt-y", "0px");
    };
    hero?.addEventListener("pointermove", move);
    hero?.addEventListener("pointerleave", reset);

    return () => {
      document.documentElement.classList.remove("motion-ready");
      observer.disconnect();
      hero?.removeEventListener("pointermove", move);
      hero?.removeEventListener("pointerleave", reset);
    };
  }, []);

  return null;
}
