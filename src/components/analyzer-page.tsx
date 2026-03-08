"use client";

import clsx from "clsx";
import { toPng } from "html-to-image";
import { AlertCircle, FileUp, LoaderCircle, WandSparkles } from "lucide-react";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";

import { AnalysisResults } from "@/components/analysis-results";
import type {
  GeneralAnalysisResult,
  JobFitAnalysisResult,
  ParsedCv,
} from "@/lib/schemas";

type AnalyzerMode = "general" | "job-fit";
type AnalysisResult = GeneralAnalysisResult | JobFitAnalysisResult;

type AnalyzerPageProps = {
  mode: AnalyzerMode;
};

const MODE_COPY = {
  general: {
    eyebrow: "Mode 01",
    title: "How Employable Am I?",
    subtitle:
      "Upload your CV and get a recruiter-style diagnosis with enough drama to be shareable and enough signal to actually help.",
    endpoint: "/api/analyze/general",
    buttonLabel: "Diagnose My CV",
    scoreLabel: "Employability Score",
    previewTitle: "What this mode focuses on",
    previewPoints: [
      "Interview-readiness in the current market",
      "Recruiter first impression after a fast scan",
      "Practical rewrites you can use immediately",
    ],
    loadingStages: [
      "Scanning for actual signal, not decorative buzzwords...",
      "Translating recruiter skepticism into something useful...",
      "Sharpening the verdict so it stings just enough...",
    ],
  },
  "job-fit": {
    eyebrow: "Mode 02",
    title: "How Employable Am I for This Job?",
    subtitle:
      "Upload your CV, paste the job description, and see whether this application looks like a real match or a hopeful reach.",
    endpoint: "/api/analyze/job-fit",
    buttonLabel: "Check My Job Fit",
    scoreLabel: "Job Match Score",
    previewTitle: "What this mode focuses on",
    previewPoints: [
      "CV evidence against job requirements",
      "Missing keywords and underplayed strengths",
      "Tailored rewrites before you apply",
    ],
    loadingStages: [
      "Lining up the CV against the job brief...",
      "Checking where the experience lands and where it slips...",
      "Turning the mismatch into a sharper application...",
    ],
  },
} as const;

async function parseCvFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/parse-cv", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to read that PDF.");
  }

  return payload as ParsedCv;
}

async function postJson<T>(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "The analysis request failed.");
  }

  return payload as T;
}

export function AnalyzerPage({ mode }: AnalyzerPageProps) {
  const copy = MODE_COPY[mode];
  const [file, setFile] = useState<File | null>(null);
  const [cvTextOverride, setCvTextOverride] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [submittedFileName, setSubmittedFileName] = useState("");
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const deferredJobDescription = useDeferredValue(jobDescription);

  useEffect(() => {
    if (!isAnalyzing) {
      return undefined;
    }

    setStatusIndex(0);
    const intervalId = window.setInterval(() => {
      setStatusIndex((currentIndex) => (currentIndex + 1) % copy.loadingStages.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [copy.loadingStages.length, isAnalyzing]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setParseWarning(null);
    setResult(null);
    setPreviewText("");

    if (!file) {
      setError("Upload a PDF CV first. The diagnosis needs something real to read.");
      return;
    }

    if (mode === "job-fit" && jobDescription.trim().length < 60) {
      setError("Paste a fuller job description so the match score has something real to compare against.");
      return;
    }

    setIsAnalyzing(true);
    setSubmittedFileName(file.name);

    try {
      const manualText = cvTextOverride.trim();
      let cvText = manualText;
      let source = "Manual CV text";

      if (!manualText) {
        const parsedCv = await parseCvFile(file);
        setPreviewText(parsedCv.text.slice(0, 420));

        if (parsedCv.quality === "low") {
          setParseWarning(
            parsedCv.warning ??
              "The PDF text looks incomplete. Paste your CV manually below and rerun.",
          );
          setSourceLabel("PDF extraction looked incomplete");
          return;
        }

        cvText = parsedCv.text;
        source = `Parsed from ${parsedCv.pageCount} page PDF`;
      } else {
        setPreviewText(manualText.slice(0, 420));
      }

      const response = await postJson<AnalysisResult>(copy.endpoint, {
        cvText,
        cvFileName: file.name,
        ...(mode === "job-fit" ? { jobDescription: jobDescription.trim() } : {}),
      });

      startTransition(() => {
        setResult(response);
        setSourceLabel(source);
      });

      window.requestAnimationFrame(() => {
        document.getElementById("analysis-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went sideways during analysis.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleExport() {
    if (!shareCardRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fffaf2",
      });
      const link = document.createElement("a");
      link.download = `${mode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }

  const jdReadinessCopy =
    mode === "job-fit"
      ? deferredJobDescription.trim().length >= 240
        ? "That brief is specific enough to produce a real match score."
        : "The more specific the job description, the sharper the verdict."
      : null;

  return (
    <main className="page-frame">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <div className="hero-links">
            <Link href="/general">General diagnosis</Link>
            <Link href="/job-fit">Job-specific diagnosis</Link>
          </div>
        </div>

        <aside className="panel insight-panel">
          <span className="mini-label">{copy.previewTitle}</span>
          <ul className="bullet-list bullet-list--compact">
            {copy.previewPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="analysis-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="section-heading">
            <FileUp size={18} />
            <div>
              <h2>Upload the CV</h2>
              <p>PDF only for v1. If extraction looks thin, paste the text manually below.</p>
            </div>
          </div>

          <label className={clsx("upload-card", file && "upload-card--active")}>
            <input
              accept=".pdf,application/pdf"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setError(null);
                setParseWarning(null);
                setResult(null);
              }}
              type="file"
            />
            <strong>{file ? file.name : "Choose your CV PDF"}</strong>
            <span>
              {file
                ? "Locked in. If parsing goes weird, use the fallback text box below."
                : "Drag it in or click here. Keep it under 5 MB."}
            </span>
          </label>

          <label className="field-label" htmlFor="cv-fallback">
            CV text fallback
          </label>
          <textarea
            className="text-input text-input--large"
            id="cv-fallback"
            onChange={(event) => setCvTextOverride(event.target.value)}
            placeholder="Optional but useful if the PDF is image-based or messy. Paste your CV text here to override extraction."
            value={cvTextOverride}
          />

          {mode === "job-fit" ? (
            <>
              <label className="field-label" htmlFor="job-description">
                Job description
              </label>
              <textarea
                className="text-input text-input--large"
                id="job-description"
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the full job description here. Requirements, scope, preferred skills, the whole thing."
                value={jobDescription}
              />
              <p className="helper-copy">{jdReadinessCopy}</p>
            </>
          ) : null}

          {(error || parseWarning) && (
            <div className={clsx("message-box", error ? "message-box--error" : "message-box--warning")}>
              <AlertCircle size={18} />
              <span>{error ?? parseWarning}</span>
            </div>
          )}

          <button className="primary-button" disabled={isAnalyzing} type="submit">
            {isAnalyzing ? <LoaderCircle className="spin" size={18} /> : <WandSparkles size={18} />}
            {isAnalyzing ? copy.loadingStages[statusIndex] : copy.buttonLabel}
          </button>
        </form>

        <aside className="panel side-panel">
          <div className="section-heading">
            <WandSparkles size={18} />
            <div>
              <h2>Output shape</h2>
              <p>This is designed to be screenshot-friendly, not buried in a PDF report.</p>
            </div>
          </div>
          <div className="stack-list">
            <div>
              <span className="mini-label">Hero score</span>
              <p>{copy.scoreLabel} with a verdict that lands immediately.</p>
            </div>
            <div>
              <span className="mini-label">Actionable rewrite</span>
              <p>Fresh summary, sharper bullets, and role-aware fixes instead of generic advice.</p>
            </div>
            <div>
              <span className="mini-label">Shareable result</span>
              <p>A compact card that works as a screenshot and exports as a PNG.</p>
            </div>
          </div>

          {previewText ? (
            <div className="preview-card">
              <span className="mini-label">CV text preview</span>
              <p>{previewText}{previewText.length >= 420 ? "..." : ""}</p>
            </div>
          ) : null}
        </aside>
      </section>

      {result ? (
        <AnalysisResults
          cvFileName={submittedFileName}
          isExporting={isExporting}
          mode={mode}
          onExport={handleExport}
          result={result}
          shareCardRef={shareCardRef}
          sourceLabel={sourceLabel}
        />
      ) : null}
    </main>
  );
}
