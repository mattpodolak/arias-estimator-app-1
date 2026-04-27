"use client";

import { useEffect, useState } from "react";
import type { TradeId } from "./rates";
import type { RateOverrides } from "./types";

export type CompanyInfo = {
  name: string;
  tagline: string;
  license: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  brand: string;
  logoDataUrl?: string;
};

import { DEFAULT_EMAIL_SETTINGS, type EmailSettings } from "./email";

export type AppSettings = {
  company: CompanyInfo;
  /** Trades enabled by default for new estimates. Empty array = all trades. */
  defaultTrades: TradeId[];
  /** Per-rate-id labor/material overrides applied on top of the base rate book. */
  rateOverrides: RateOverrides;
  /** Email settings */
  email: EmailSettings;
};

export const DEFAULT_COMPANY: CompanyInfo = {
  name: "ARIAS INTERIOR SYSTEMS",
  tagline: "Multi-Trade Construction Estimating",
  license: "CA LIC #1107225",
  email: "estimating@ariasinteriorsystems.com",
  phone: "(555) 555-5555",
  address: "Southern California",
  website: "www.ariasinteriorsystems.com",
  brand: "#0052CC",
};

export const DEFAULT_SETTINGS: AppSettings = {
  company: DEFAULT_COMPANY,
  defaultTrades: [],
  rateOverrides: {},
  email: DEFAULT_EMAIL_SETTINGS,
};

const STORAGE_KEY = "arias.settings.v1";
const CHANGE_EVENT = "arias.settings.changed";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      company: { ...DEFAULT_COMPANY, ...(parsed.company ?? {}) },
      defaultTrades: Array.isArray(parsed.defaultTrades)
        ? (parsed.defaultTrades as TradeId[])
        : [],
      rateOverrides:
        parsed.rateOverrides && typeof parsed.rateOverrides === "object"
          ? (parsed.rateOverrides as RateOverrides)
          : {},
      email: { ...DEFAULT_EMAIL_SETTINGS, ...(parsed.email ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function resetSettings() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * React hook returning the live AppSettings and a setter that persists.
 * Re-reads from localStorage when settings change in this tab or another tab.
 */
export function useSettings(): [AppSettings, (s: AppSettings) => void] {
  const [settings, setLocal] = useState<AppSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setLocal(loadSettings());
    const handler = () => setLocal(loadSettings());
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  const setter = (next: AppSettings) => {
    saveSettings(next);
    setLocal(next);
  };
  return [settings, setter];
}
