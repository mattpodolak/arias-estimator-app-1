"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Stepper, type StepKey } from "@/components/Stepper";
import { UploadStep } from "@/components/UploadStep";
import { EstimateStep } from "@/components/EstimateStep";
import { ProposalStep } from "@/components/ProposalStep";
import { SignStep } from "@/components/SignStep";
import { buildEstimate } from "@/lib/estimate";
import { defaultProjectInfo, defaultProposalConfig } from "@/lib/defaults";
import type {
  Estimate,
  ExtractionResult,
  LineItem,
  ProjectInfo,
  ProposalConfig,
} from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<StepKey>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [project, setProject] = useState<ProjectInfo>(defaultProjectInfo);
  const [proposal, setProposal] = useState<ProposalConfig>(defaultProposalConfig);

  const reachable: Record<StepKey, boolean> = {
    upload: true,
    estimate: lineItems.length > 0 || extraction !== null,
    proposal: lineItems.length > 0,
    sign: lineItems.length > 0,
  };

  const estimate: Estimate = useMemo(() => {
    const labor = round2(lineItems.reduce((s, l) => s + l.laborTotal, 0));
    const material = round2(lineItems.reduce((s, l) => s + l.materialTotal, 0));
    return {
      lineItems,
      laborSubtotal: labor,
      materialSubtotal: material,
      grandTotal: round2(labor + material),
      generatedAt: new Date().toISOString(),
    };
  }, [lineItems]);

  function onExtracted(file: File, result: ExtractionResult) {
    setFileName(file.name);
    setExtraction(result);
    const built = buildEstimate(result.measurements);
    setLineItems(built.lineItems);
    setStep("estimate");
  }

  function reset() {
    setFileName(null);
    setExtraction(null);
    setLineItems([]);
    setProject(defaultProjectInfo());
    setProposal(defaultProposalConfig());
    setStep("upload");
  }

  return (
    <main className="min-h-screen pb-24">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Estimating &amp; Proposal Workspace
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload plans, build a takeoff, generate a branded proposal, and send for
              signature.
            </p>
          </div>
        </div>

        <Stepper current={step} onSelect={(k) => setStep(k)} reachable={reachable} />

        <div className="mt-8">
          {step === "upload" && <UploadStep onExtracted={onExtracted} />}
          {step === "estimate" && (
            <EstimateStep
              fileName={fileName}
              extraction={extraction}
              lineItems={lineItems}
              setLineItems={setLineItems}
              onBack={() => setStep("upload")}
              onContinue={() => setStep("proposal")}
            />
          )}
          {step === "proposal" && (
            <ProposalStep
              project={project}
              setProject={setProject}
              proposal={proposal}
              setProposal={setProposal}
              estimate={estimate}
              onBack={() => setStep("estimate")}
              onContinue={() => setStep("sign")}
            />
          )}
          {step === "sign" && (
            <SignStep
              project={project}
              estimate={estimate}
              onBack={() => setStep("proposal")}
              onReset={reset}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
