"use client";

import clsx from "clsx";
import { toPng } from "html-to-image";
import { AlertCircle, CheckCircle, FileUp, LoaderCircle, Upload, WandSparkles } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";

import { AnalysisResults } from "@/components/analysis-results";
import {
  buildManualPasteAfterFallbackFailure,
  buildOcrFallbackNotice,
} from "@/lib/pdf-fallback";
import type {
  GeneralAnalysisResult,
  JobFitAnalysisResult,
  ParsedCv,
} from "@/lib/schemas";

type AnalyzerMode = "general" | "job-fit";
type AnalysisResult = GeneralAnalysisResult | JobFitAnalysisResult;

const MODE_CONFIG = {
  general: {
    endpoint: "/api/analyze/general",
    buttonLabel: "Analyze my CV",
    scoreLabel: "Employability Score",
    loadingStages: [
      "Scanning for actual signal, not decorative buzzwords...",
      "Translating recruiter skepticism into something useful...",
      "Sharpening the verdict so it stings just enough...",
    ],
  },
  "job-fit": {
    endpoint: "/api/analyze/job-fit",
    buttonLabel: "Check my fit",
    scoreLabel: "Job Match Score",
    loadingStages: [
      "Lining up the CV against the job brief...",
      "Checking where the experience lands and where it slips...",
      "Turning the mismatch into a sharper application...",
    ],
  },
} as const;

async function readApiPayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as { error?: string };
  } catch {
    return {
      error: text,
    };
  }
}

async function parseCvFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/parse-cv", {
    method: "POST",
    body: formData,
  });

  const payload = await readApiPayload(response);

  if (!response.ok) {
    throw new Error(payload?.error ?? `Unable to read that PDF (status ${response.status}).`);
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

  const payload = await readApiPayload(response);

  if (!response.ok) {
    throw new Error(payload?.error ?? `The analysis request failed (status ${response.status}).`);
  }

  return payload as T;
}

async function postForm<T>(url: string, body: { file: File; jobDescription?: string }) {
  const formData = new FormData();
  formData.append("file", body.file);

  if (body.jobDescription) {
    formData.append("jobDescription", body.jobDescription);
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const payload = await readApiPayload(response);

  if (!response.ok) {
    throw new Error(payload?.error ?? `The analysis request failed (status ${response.status}).`);
  }

  return payload as T;
}

export function AnalyzerFlow() {
  const [mode, setMode] = useState<AnalyzerMode>("general");
  const config = MODE_CONFIG[mode];

  const [file, setFile] = useState<File | null>(null);
  const [cvTextOverride, setCvTextOverride] = useState("");
  const [showCvTextFallback, setShowCvTextFallback] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [submittedFileName, setSubmittedFileName] = useState("");
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const deferredJobDescription = useDeferredValue(jobDescription);

  useEffect(() => {
    if (!isAnalyzing) {
      return undefined;
    }

    setStatusIndex(0);
    const intervalId = window.setInterval(() => {
      setStatusIndex((currentIndex) => (currentIndex + 1) % config.loadingStages.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [config.loadingStages.length, isAnalyzing]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setParseWarning(null);
    setResult(null);

    if (!file) {
      setError("Upload a PDF first — we need something to work with.");
      return;
    }

    if (mode === "job-fit" && jobDescription.trim().length < 60) {
      setError("Paste a fuller job description so we have something real to compare against.");
      return;
    }

    setIsAnalyzing(true);
    setSubmittedFileName(file.name);

    try {
      const manualText = cvTextOverride.trim();

      if (manualText) {
        const response = await postJson<AnalysisResult>(config.endpoint, {
          cvText: manualText,
          cvFileName: file.name,
          ...(mode === "job-fit" ? { jobDescription: jobDescription.trim() } : {}),
        });

        startTransition(() => {
          setResult(response);
        });
      } else {
        let parsedCv: ParsedCv | null = null;
        let shouldUseOcrFallback = false;
        let ocrFallbackReason: string | undefined;

        try {
          parsedCv = await parseCvFile(file);

          if (parsedCv.quality === "low") {
            shouldUseOcrFallback = true;
            ocrFallbackReason = parsedCv.warning ?? "Local extraction looked incomplete.";
            setParseWarning(buildOcrFallbackNotice(ocrFallbackReason));
          }
        } catch (parseError) {
          shouldUseOcrFallback = true;
          ocrFallbackReason =
            parseError instanceof Error ? parseError.message : "Local extraction failed.";
          setParseWarning(buildOcrFallbackNotice(ocrFallbackReason));
        }

        if (shouldUseOcrFallback) {
          try {
            const response = await postForm<AnalysisResult>(config.endpoint, {
              file,
              ...(mode === "job-fit" ? { jobDescription: jobDescription.trim() } : {}),
            });
            setParseWarning(null);

            startTransition(() => {
              setResult(response);
            });
          } catch (ocrError) {
            setShowCvTextFallback(true);
            throw new Error(
              buildManualPasteAfterFallbackFailure(
                ocrFallbackReason,
                ocrError instanceof Error ? ocrError.message : undefined,
              ),
            );
          }
        } else if (parsedCv) {
          const response = await postJson<AnalysisResult>(config.endpoint, {
            cvText: parsedCv.text,
            cvFileName: file.name,
            ...(mode === "job-fit" ? { jobDescription: jobDescription.trim() } : {}),
          });

          startTransition(() => {
            setResult(response);
          });
        }
      }

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
          : "Something went wrong during analysis.",
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
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${mode}-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }

  const jdReadinessCopy =
    mode === "job-fit"
      ? deferredJobDescription.trim().length >= 240
        ? "That's detailed enough to produce a sharp match score."
        : "The more detail you paste, the sharper the verdict."
      : null;

  return (
    <>
      <section className="hero">
        <h1>How Employable Am I?</h1>
        <p>
          Upload your CV and get a brutally honest diagnosis — with a score, a verdict,
          and rewrites you can actually use.
        </p>
      </section>

      <form onSubmit={handleSubmit}>
        {/* Upload area */}
        <label className={clsx("upload-card", file && "upload-card--active")}>
          <input
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
              setError(null);
              setParseWarning(null);
              setResult(null);
              setShowCvTextFallback(false);
              setCvTextOverride("");
            }}
            type="file"
          />
          {file ? (
            <>
              <CheckCircle size={24} className="upload-card__icon" />
              <span className="upload-card__title">{file.name}</span>
              <span className="upload-card__hint">Ready to analyze</span>
            </>
          ) : (
            <>
              <Upload size={24} style={{ color: "var(--ink-muted)" }} />
              <span className="upload-card__title">Drop your PDF here or click to browse</span>
              <span className="upload-card__hint">PDF, up to 5 MB</span>
            </>
          )}
        </label>

        {/* Mode toggle — only shown after file is selected */}
        {file && (
          <div className="analyzer-section">
            <div className="mode-toggle">
              <button
                type="button"
                className={mode === "general" ? "active" : ""}
                onClick={() => setMode("general")}
              >
                General
              </button>
              <button
                type="button"
                className={mode === "job-fit" ? "active" : ""}
                onClick={() => setMode("job-fit")}
              >
                Job Fit
              </button>
            </div>

            {/* Job description — only shown in job-fit mode */}
            {mode === "job-fit" && (
              <div style={{ marginTop: 20 }}>
                <label className="field-label" htmlFor="job-description">
                  Job description
                </label>
                <textarea
                  className="text-input text-input--large"
                  id="job-description"
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the full job description here — requirements, scope, preferred skills, all of it."
                  value={jobDescription}
                />
                {jdReadinessCopy && <p className="helper-copy">{jdReadinessCopy}</p>}
              </div>
            )}

            {/* CV text fallback — only shown when extraction fails */}
            {showCvTextFallback && (
              <div style={{ marginTop: 20 }}>
                <label className="field-label" htmlFor="cv-fallback">
                  CV text (manual paste)
                </label>
                <textarea
                  className="text-input text-input--large"
                  id="cv-fallback"
                  onChange={(event) => setCvTextOverride(event.target.value)}
                  placeholder="We couldn't read your PDF automatically. Paste your CV text here instead."
                  value={cvTextOverride}
                />
              </div>
            )}

            {/* Error / warning messages */}
            {(error || parseWarning) && (
              <div className={clsx("message-box", error ? "message-box--error" : "message-box--warning")}>
                <AlertCircle size={18} />
                <span>{error ?? parseWarning}</span>
              </div>
            )}

            {/* Submit button */}
            <button className="primary-button" disabled={isAnalyzing} type="submit">
              {isAnalyzing ? <LoaderCircle className="spin" size={18} /> : <WandSparkles size={18} />}
              {isAnalyzing ? config.loadingStages[statusIndex] : config.buttonLabel}
            </button>
          </div>
        )}
      </form>

      {/* Results */}
      {result ? (
        <AnalysisResults
          cvFileName={submittedFileName}
          isExporting={isExporting}
          mode={mode}
          onExport={handleExport}
          result={result}
          shareCardRef={shareCardRef}
        />
      ) : null}
    </>
  );
}
