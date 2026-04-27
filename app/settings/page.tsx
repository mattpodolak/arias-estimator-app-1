"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  DEFAULT_RATES,
  TRADES,
  TRADE_LABEL,
  type RateConfig,
  type Trade,
} from "@/lib/rates";
import {
  DEFAULT_COMPANY,
  DEFAULT_SETTINGS,
  loadSettings,
  resetSettings,
  saveSettings,
  type AppSettings,
  type CompanyInfo,
} from "@/lib/settings";
import type { RateOverrides } from "@/lib/types";
import { formatCurrency } from "@/lib/estimate";

const round2 = (n: number) => Math.round(n * 100) / 100;

const MAX_LOGO_BYTES = 256 * 1024; // 256 KB before we warn

export default function SettingsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  function patchCompany(patch: Partial<CompanyInfo>) {
    setSettings((s) => ({ ...s, company: { ...s.company, ...patch } }));
  }

  function toggleTrade(tradeId: string) {
    setSettings((s) => {
      const set = new Set(s.defaultTrades);
      if (set.has(tradeId as any)) set.delete(tradeId as any);
      else set.add(tradeId as any);
      return { ...s, defaultTrades: Array.from(set) };
    });
  }

  function selectAllTrades() {
    setSettings((s) => ({ ...s, defaultTrades: TRADES.map((t) => t.id) }));
  }

  function clearTrades() {
    setSettings((s) => ({ ...s, defaultTrades: [] }));
  }

  function patchRate(
    rateId: string,
    field: "laborRate" | "materialRate",
    value: number,
  ) {
    setSettings((s) => {
      const next: RateOverrides = { ...s.rateOverrides };
      const existing = next[rateId] ?? {};
      next[rateId] = { ...existing, [field]: round2(value) };
      return { ...s, rateOverrides: next };
    });
  }

  function clearRateOverride(rateId: string) {
    setSettings((s) => {
      const next: RateOverrides = { ...s.rateOverrides };
      delete next[rateId];
      return { ...s, rateOverrides: next };
    });
  }

  function clearAllOverrides() {
    setSettings((s) => ({ ...s, rateOverrides: {} }));
  }

  async function onLogoFile(file: File) {
    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file (PNG, JPG, SVG).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES * 8) {
      setLogoError(
        `Logo is ${(file.size / 1024).toFixed(0)} KB — please upload a file under ~2 MB.`,
      );
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
      reader.readAsDataURL(file);
    });
    patchCompany({ logoDataUrl: dataUrl });
  }

  function clearLogo() {
    patchCompany({ logoDataUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function save() {
    saveSettings(settings);
    setSavedAt(new Date().toISOString());
  }

  function resetAll() {
    if (!confirm("Reset every setting to the defaults?")) return;
    resetSettings();
    setSettings(loadSettings());
    setSavedAt(new Date().toISOString());
  }

  const tradeGroups = useMemo(() => {
    const map = new Map<string, RateConfig[]>();
    for (const r of DEFAULT_RATES) {
      const list = map.get(r.trade.id) ?? [];
      list.push(r);
      map.set(r.trade.id, list);
    }
    return map;
  }, []);

  const overrideCount = Object.keys(settings.rateOverrides).length;

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Company profile, default trades, and rate book overrides — saved
              locally to this device.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost">
              ← Back to estimator
            </Link>
            <button type="button" className="btn-secondary" onClick={resetAll}>
              Reset to defaults
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              Save settings
            </button>
            {savedAt && (
              <span className="text-xs text-slate-500">
                Saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {!hydrated ? (
          <div className="card p-6 text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="space-y-6">
            {/* Company info */}
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Company</h2>
              <p className="mt-1 text-sm text-slate-500">
                Shown on the header, footer, and every PDF proposal you generate.
              </p>

              <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
                <div>
                  <span className="label">Logo</span>
                  <div className="mt-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                    {settings.company.logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.company.logoDataUrl}
                        alt="Company logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-3 text-center text-xs text-slate-400">
                        No logo uploaded
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-arias-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-arias-700 hover:file:bg-arias-100"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onLogoFile(f);
                    }}
                  />
                  {settings.company.logoDataUrl && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-rose-600 hover:underline"
                      onClick={clearLogo}
                    >
                      Remove logo
                    </button>
                  )}
                  {logoError && (
                    <p className="mt-2 text-xs text-rose-600">{logoError}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company name">
                    <input
                      className="input"
                      value={settings.company.name}
                      onChange={(e) => patchCompany({ name: e.target.value })}
                    />
                  </Field>
                  <Field label="Tagline">
                    <input
                      className="input"
                      value={settings.company.tagline}
                      onChange={(e) => patchCompany({ tagline: e.target.value })}
                    />
                  </Field>
                  <Field label="License #">
                    <input
                      className="input"
                      value={settings.company.license}
                      onChange={(e) => patchCompany({ license: e.target.value })}
                      placeholder="e.g. CA LIC #1107225"
                    />
                  </Field>
                  <Field label="Brand color">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="h-10 w-12 cursor-pointer rounded border border-slate-200"
                        value={settings.company.brand}
                        onChange={(e) => patchCompany({ brand: e.target.value })}
                      />
                      <input
                        className="input"
                        value={settings.company.brand}
                        onChange={(e) => patchCompany({ brand: e.target.value })}
                      />
                    </div>
                  </Field>
                  <Field label="Email">
                    <input
                      className="input"
                      value={settings.company.email}
                      onChange={(e) => patchCompany({ email: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className="input"
                      value={settings.company.phone}
                      onChange={(e) => patchCompany({ phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      className="input"
                      value={settings.company.address}
                      onChange={(e) => patchCompany({ address: e.target.value })}
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      className="input"
                      value={settings.company.website}
                      onChange={(e) => patchCompany({ website: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Trades */}
            <section className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Visible trades
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick the trades you bid on — only their rates will surface in
                    new estimates. Leave empty to show every trade.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={selectAllTrades}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={clearTrades}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TRADES.map((t) => {
                  const on = settings.defaultTrades.includes(t.id);
                  const fullSet = settings.defaultTrades.length === 0;
                  return (
                    <label
                      key={t.id}
                      className={[
                        "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
                        on || fullSet
                          ? "border-arias-300 bg-arias-50/60 text-arias-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={on}
                        onChange={() => toggleTrade(t.id)}
                      />
                      <span className="font-medium">{t.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Rate overrides */}
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Rates per trade
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Edits override the defaults from <code>rates.json</code> —
                    leave blank to keep the default. {overrideCount > 0 && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        {overrideCount} custom
                      </span>
                    )}
                  </p>
                </div>
                {overrideCount > 0 && (
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={clearAllOverrides}
                  >
                    Reset all overrides
                  </button>
                )}
              </div>

              <div className="space-y-6 px-2 py-4 sm:px-4">
                {TRADES.map((t) => {
                  const rates = tradeGroups.get(t.id) ?? [];
                  if (rates.length === 0) return null;
                  const enabled =
                    settings.defaultTrades.length === 0 ||
                    settings.defaultTrades.includes(t.id);
                  return (
                    <div key={t.id} className="px-2 sm:px-4">
                      <div className="flex items-center justify-between">
                        <h3
                          className={[
                            "text-sm font-semibold",
                            enabled ? "text-slate-900" : "text-slate-400",
                          ].join(" ")}
                        >
                          {t.label}
                        </h3>
                        {!enabled && (
                          <span className="text-[11px] uppercase tracking-wide text-slate-400">
                            Hidden — toggle on above to use
                          </span>
                        )}
                      </div>
                      <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">
                                Item
                              </th>
                              <th className="px-3 py-2 text-left font-semibold">
                                Unit
                              </th>
                              <th className="px-3 py-2 text-right font-semibold">
                                Labor (default)
                              </th>
                              <th className="px-3 py-2 text-right font-semibold">
                                Material (default)
                              </th>
                              <th className="px-3 py-2 text-right font-semibold">
                                Custom labor
                              </th>
                              <th className="px-3 py-2 text-right font-semibold">
                                Custom material
                              </th>
                              <th className="px-3 py-2 text-right font-semibold">
                                Effective
                              </th>
                              <th className="w-8 px-2 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rates.map((r) => {
                              const o = settings.rateOverrides[r.id] ?? {};
                              const labor = o.laborRate ?? r.laborRate;
                              const material = o.materialRate ?? r.materialRate;
                              const dirty = o.laborRate !== undefined || o.materialRate !== undefined;
                              return (
                                <tr key={r.id} className="align-top">
                                  <td className="px-3 py-2">
                                    <div className="font-medium text-slate-800">
                                      {r.description}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {r.id}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {r.unit}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                                    {formatCurrency(r.laborRate)}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                                    {formatCurrency(r.materialRate)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <RateCell
                                      placeholder={r.laborRate}
                                      value={o.laborRate}
                                      onChange={(v) => patchRate(r.id, "laborRate", v)}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <RateCell
                                      placeholder={r.materialRate}
                                      value={o.materialRate}
                                      onChange={(v) => patchRate(r.id, "materialRate", v)}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                                    {formatCurrency(round2(labor + material))}
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    {dirty ? (
                                      <button
                                        type="button"
                                        className="text-slate-400 hover:text-rose-600"
                                        title="Reset to default"
                                        onClick={() => clearRateOverride(r.id)}
                                      >
                                        ↺
                                      </button>
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={resetAll}>
                Reset to defaults
              </button>
              <button type="button" className="btn-primary" onClick={save}>
                Save settings
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function RateCell({
  value,
  placeholder,
  onChange,
}: {
  value: number | undefined;
  placeholder: number;
  onChange: (n: number) => void;
}) {
  const [raw, setRaw] = useState(value === undefined ? "" : String(value));
  useEffect(() => {
    setRaw(value === undefined ? "" : String(value));
  }, [value]);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">
        $
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        className="input pl-5 text-right"
        value={raw}
        placeholder={String(placeholder)}
        onChange={(e) => {
          setRaw(e.target.value);
          if (e.target.value === "") return;
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </div>
  );
}
