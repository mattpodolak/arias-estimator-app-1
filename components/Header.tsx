import React from "react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <div className="hidden text-right text-[11px] uppercase tracking-wider text-slate-500 sm:block">
          <div>CA Lic. #1107225</div>
          <div className="text-slate-400">Estimator · Proposal</div>
        </div>
      </div>
    </header>
  );
}
