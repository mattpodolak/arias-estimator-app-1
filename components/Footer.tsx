"use client";

import React from "react";
import { useSettings } from "@/lib/settings";

export function Footer() {
  const [settings] = useSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-[11px] text-slate-500 sm:flex-row">
        <div>© {year} {settings.company.name}</div>
        {settings.company.license && <div>{settings.company.license}</div>}
      </div>
    </footer>
  );
}
