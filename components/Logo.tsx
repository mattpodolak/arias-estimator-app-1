import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      <div className="leading-tight">
        <div className="text-base font-bold tracking-tight text-arias-700">
          ARIAS INTERIOR SYSTEMS
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Drywall · Metal Framing
        </div>
      </div>
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="8" fill="#0052CC" />
      <path
        d="M11 28 L20 11 L29 28 H24.5 L20 19 L15.5 28 Z"
        fill="white"
      />
      <rect x="17" y="24" width="6" height="2" fill="#0052CC" />
    </svg>
  );
}
